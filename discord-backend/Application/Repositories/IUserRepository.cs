using Domain.Entities;
using System.Threading.Tasks;

//Çekirdeğimizi oluşturduk. Şimdi Application katmanına geçiyoruz. Bu katman, "sistemimizin ne yapabildiğini" 
//tanımlar ama "nasıl yaptığını" bilmez. Veri tabanına nasıl bağlanacağını bilmez,
 //sadece bağlanması gerektiğini bilir. Bunu sağlamak için "Interface" (Arayüz/Sözleşme) kullanırız.
namespace Application.Repositories
{
    // Interface (I) bir sözleşmedir. Application katmanı der ki: 
    // "Bana dışarıdan öyle bir sınıf verin ki, içinde Email'e göre kullanıcı getiren bir metot olsun. 
    // İçeride Supabase mi var SQL mi var beni ilgilendirmez."
    public interface IUserRepository
    {
        Task<User> GetByEmailAsync(string email);
    }
}