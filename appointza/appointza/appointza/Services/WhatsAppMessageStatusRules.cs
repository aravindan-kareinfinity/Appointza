using appointza.Models;

namespace appointza.Services
{
    /// <summary>
    /// Explicit WhatsApp provider status transition rules.
    /// Rank: queued → sent → delivered → read. failed is terminal.
    /// Duplicates and downgrades are rejected.
    /// </summary>
    public static class WhatsAppMessageStatusRules
    {
        private static readonly Dictionary<string, int> Rank = new(StringComparer.OrdinalIgnoreCase)
        {
            [WhatsAppMessageStatuses.Queued] = 0,
            [WhatsAppMessageStatuses.Sent] = 1,
            [WhatsAppMessageStatuses.Delivered] = 2,
            [WhatsAppMessageStatuses.Read] = 3,
            [WhatsAppMessageStatuses.Received] = 1,
            [WhatsAppMessageStatuses.Failed] = 100,
        };

        public static bool CanApply(string? current, string? next)
        {
            if (string.IsNullOrWhiteSpace(next)) return false;
            current = (current ?? "").Trim().ToLowerInvariant();
            next = next.Trim().ToLowerInvariant();
            if (current == next) return false;
            if (current == WhatsAppMessageStatuses.Failed) return false;
            if (next == WhatsAppMessageStatuses.Failed) return true;
            if (!Rank.TryGetValue(current, out var curRank)) return true;
            if (!Rank.TryGetValue(next, out var nextRank)) return true;
            return nextRank >= curRank;
        }
    }
}
