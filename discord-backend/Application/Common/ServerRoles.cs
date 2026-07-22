namespace Application.Common
{
    public static class ServerRoles
    {
        public static bool CanManageChannels(string? role)
        {
            if (string.IsNullOrWhiteSpace(role)) return false;
            return string.Equals(role, "Owner", System.StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "Admin", System.StringComparison.OrdinalIgnoreCase);
        }
    }
}
