using System.Security.Cryptography;
using System.Text;

namespace appointza.Services
{
    public static class WhatsAppWebhookSecurity
    {
        /// <summary>
        /// Validates Meta X-Hub-Signature-256 against the exact raw request body.
        /// </summary>
        public static bool ValidateSignature(string appSecret, string? rawBody, string? signatureHeader)
        {
            if (string.IsNullOrEmpty(appSecret))
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(signatureHeader) ||
                !signatureHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var provided = signatureHeader.Substring("sha256=".Length).Trim().ToLowerInvariant();
            if (provided.Length == 0 || provided.Length % 2 != 0)
            {
                return false;
            }

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(appSecret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody ?? ""));
            var expected = Convert.ToHexString(hash).ToLowerInvariant();

            // Length mismatch must not throw from FixedTimeEquals.
            if (expected.Length != provided.Length)
            {
                return false;
            }

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expected),
                Encoding.UTF8.GetBytes(provided));
        }

        /// <summary>Constant-time compare for webhook verify_token challenge.</summary>
        public static bool FixedTimeEqualsUtf8(string? a, string? b)
        {
            var left = Encoding.UTF8.GetBytes(a ?? "");
            var right = Encoding.UTF8.GetBytes(b ?? "");
            if (left.Length != right.Length)
            {
                // Compare against self-length padding to avoid early exit timing on length alone.
                var padded = new byte[left.Length];
                Buffer.BlockCopy(right, 0, padded, 0, Math.Min(right.Length, padded.Length));
                CryptographicOperations.FixedTimeEquals(left, padded);
                return false;
            }
            return CryptographicOperations.FixedTimeEquals(left, right);
        }

        public static string ComputeSignatureHeader(string appSecret, string rawBody)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(appSecret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody ?? ""));
            return "sha256=" + Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
