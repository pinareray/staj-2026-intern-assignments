using Domain.Entities;

namespace Application.Security
{
    // Application katmanı der ki: "Bana dışarıdan öyle bir alet verin ki, 
    // ben ona Kullanıcıyı (User) verdiğimde, o bana bir Token (string) üretsin."
    public interface ITokenHelper
    {
        string CreateToken(User user);
    }
}