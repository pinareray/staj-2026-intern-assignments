using System;

namespace Application.Interfaces
{
    public interface IUserContextService
    {
        Guid GetCurrentUserId();
        bool IsPlatformAdmin();
    }
}
