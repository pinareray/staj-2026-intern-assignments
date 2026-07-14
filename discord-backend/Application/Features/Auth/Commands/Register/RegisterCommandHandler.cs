using Application.Repositories;
using Application.Security;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Auth.Commands.Register
{
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, string>
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenHelper _tokenHelper;

        public RegisterCommandHandler(IUserRepository userRepository, ITokenHelper tokenHelper)
        {
            _userRepository = userRepository;
            _tokenHelper = tokenHelper;
        }

        public async Task<string> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            // 1. Bu e-posta zaten kayıtlı mı?
            if (await _userRepository.EmailExistsAsync(request.Email))
            {
                throw new Exception("Bu e-posta adresi zaten kullanılıyor.");
            }

            // 2. Şifreyi hashle (Salt + Hash)
            HashingHelper.CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

            // 3. Yeni kullanıcıyı oluştur
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                Username = request.Username,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            // 4. Kayıt sonrası JWT üret ve döndür
            return _tokenHelper.CreateToken(user);
        }
    }
}
