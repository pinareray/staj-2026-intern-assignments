using System;

namespace Application.Interfaces
{
    // JWT içindeki giriş yapmış kullanıcının kimliğini Application katmanına taşır.
    public interface IUserContextService
    {
        Guid GetCurrentUserId();
    }
}
