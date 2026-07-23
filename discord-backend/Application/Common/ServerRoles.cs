namespace Application.Common
{
    public static class ServerRoles
    {
        public const string Owner = "Owner";
        public const string Admin = "Admin";
        public const string Member = "Member";

        public static bool IsOwner(string? role) =>
            string.Equals(role, Owner, System.StringComparison.OrdinalIgnoreCase);

        public static bool IsAdmin(string? role) =>
            string.Equals(role, Admin, System.StringComparison.OrdinalIgnoreCase);

        public static bool CanManageChannels(string? role) =>
            IsOwner(role) || IsAdmin(role);

        public static bool CanManageMembers(string? role) =>
            IsOwner(role) || IsAdmin(role);

        public static bool CanAssignRoles(string? role) =>
            IsOwner(role);

        public static bool CanDeleteServer(string? role) =>
            IsOwner(role);
    }
}
