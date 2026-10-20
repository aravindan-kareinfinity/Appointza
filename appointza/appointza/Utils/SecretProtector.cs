using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace appointza.Utils
{
    /// <summary>
    /// AES-GCM encryption for integration secrets. Key is derived from jwtsecret (server config only).
    /// </summary>
    public class SecretProtector
    {
        private readonly byte[] _key;

        public SecretProtector(IOptions<ApplicationEnvironment> appSettings)
        {
            var material = appSettings.Value?.jwtsecret;
            if (string.IsNullOrWhiteSpace(material))
            {
                material = "appointza-dev-integration-secret-key";
            }
            _key = SHA256.HashData(Encoding.UTF8.GetBytes(material));
        }

        public string Encrypt(string plaintext)
        {
            if (string.IsNullOrEmpty(plaintext))
            {
                return string.Empty;
            }

            var nonce = new byte[12];
            RandomNumberGenerator.Fill(nonce);
            var plainBytes = Encoding.UTF8.GetBytes(plaintext);
            var cipherBytes = new byte[plainBytes.Length];
            var tag = new byte[16];

            using (var aes = new AesGcm(_key, 16))
            {
                aes.Encrypt(nonce, plainBytes, cipherBytes, tag);
            }

            var payload = new byte[nonce.Length + tag.Length + cipherBytes.Length];
            Buffer.BlockCopy(nonce, 0, payload, 0, nonce.Length);
            Buffer.BlockCopy(tag, 0, payload, nonce.Length, tag.Length);
            Buffer.BlockCopy(cipherBytes, 0, payload, nonce.Length + tag.Length, cipherBytes.Length);
            return Convert.ToBase64String(payload);
        }

        public string Decrypt(string ciphertext)
        {
            if (string.IsNullOrEmpty(ciphertext))
            {
                return string.Empty;
            }

            var payload = Convert.FromBase64String(ciphertext);
            if (payload.Length < 28)
            {
                throw new InvalidOperationException("Invalid encrypted secret payload.");
            }

            var nonce = new byte[12];
            var tag = new byte[16];
            var cipherBytes = new byte[payload.Length - 28];
            Buffer.BlockCopy(payload, 0, nonce, 0, 12);
            Buffer.BlockCopy(payload, 12, tag, 0, 16);
            Buffer.BlockCopy(payload, 28, cipherBytes, 0, cipherBytes.Length);

            var plainBytes = new byte[cipherBytes.Length];
            using (var aes = new AesGcm(_key, 16))
            {
                aes.Decrypt(nonce, cipherBytes, tag, plainBytes);
            }
            return Encoding.UTF8.GetString(plainBytes);
        }
    }
}
