using appointza.Models;

namespace appointza.Services
{
    /// <summary>
    /// Server-side campaign state transitions for Phases 5–6.
    /// </summary>
    public static class WhatsAppCampaignStateMachine
    {
        private static readonly Dictionary<string, HashSet<string>> Allowed = new(StringComparer.OrdinalIgnoreCase)
        {
            [WhatsAppCampaignStatuses.Draft] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Validating,
                WhatsAppCampaignStatuses.Ready,
                WhatsAppCampaignStatuses.Cancelled,
            },
            [WhatsAppCampaignStatuses.Validating] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Ready,
                WhatsAppCampaignStatuses.Draft,
                WhatsAppCampaignStatuses.Failed,
            },
            [WhatsAppCampaignStatuses.Ready] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Draft,
                WhatsAppCampaignStatuses.Scheduled,
                WhatsAppCampaignStatuses.Queued,
                WhatsAppCampaignStatuses.Validating,
                WhatsAppCampaignStatuses.Cancelled,
            },
            [WhatsAppCampaignStatuses.Scheduled] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Queued,
                WhatsAppCampaignStatuses.Cancelled,
                WhatsAppCampaignStatuses.Draft,
            },
            [WhatsAppCampaignStatuses.Queued] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Dispatching,
                WhatsAppCampaignStatuses.Paused,
                WhatsAppCampaignStatuses.Cancelling,
                WhatsAppCampaignStatuses.Cancelled,
            },
            [WhatsAppCampaignStatuses.Dispatching] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Paused,
                WhatsAppCampaignStatuses.Cancelling,
                WhatsAppCampaignStatuses.Completed,
                WhatsAppCampaignStatuses.CompletedWithErrors,
                WhatsAppCampaignStatuses.Failed,
                WhatsAppCampaignStatuses.Queued, // lease recovery / idle
            },
            [WhatsAppCampaignStatuses.Paused] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Queued,
                WhatsAppCampaignStatuses.Cancelling,
                WhatsAppCampaignStatuses.Cancelled,
            },
            [WhatsAppCampaignStatuses.Cancelling] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Cancelled,
            },
            [WhatsAppCampaignStatuses.Cancelled] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Draft,
            },
            [WhatsAppCampaignStatuses.Failed] = new(StringComparer.OrdinalIgnoreCase)
            {
                WhatsAppCampaignStatuses.Draft,
                WhatsAppCampaignStatuses.Validating,
                WhatsAppCampaignStatuses.Queued,
            },
        };

        public static bool CanTransition(string? from, string? to)
        {
            from = (from ?? "").Trim().ToLowerInvariant();
            to = (to ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(to) || from == to) return false;
            if (!Allowed.TryGetValue(from, out var next)) return false;
            return next.Contains(to);
        }

        public static bool IsEditable(string? status) =>
            string.Equals(status, WhatsAppCampaignStatuses.Draft, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.Ready, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.Failed, StringComparison.OrdinalIgnoreCase);

        public static bool IsSchedulable(string? status) =>
            string.Equals(status, WhatsAppCampaignStatuses.Ready, StringComparison.OrdinalIgnoreCase);

        public static bool IsDispatchable(string? status) =>
            string.Equals(status, WhatsAppCampaignStatuses.Ready, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.Scheduled, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.Queued, StringComparison.OrdinalIgnoreCase);

        public static bool IsActiveDispatch(string? status) =>
            string.Equals(status, WhatsAppCampaignStatuses.Queued, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.Dispatching, StringComparison.OrdinalIgnoreCase);

        public static bool IsTerminal(string? status) =>
            string.Equals(status, WhatsAppCampaignStatuses.Completed, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.CompletedWithErrors, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.Cancelled, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, WhatsAppCampaignStatuses.Failed, StringComparison.OrdinalIgnoreCase);
    }
}
