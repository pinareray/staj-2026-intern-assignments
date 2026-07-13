using Application.Security;
using Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Infrastructure.Security
{
    // JwtHelper, ITokenHelper sözleşmesini uygular.
    public class JwtHelper : ITokenHelper
    {
        private readonly IConfiguration _configuration;

        // Gizli anahtarımızı (Secret Key) okumak için ayar dosyasını (IConfiguration) içeri alıyoruz.
        public JwtHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string CreateToken(User user)
        {
            // 1. Token'ın içine gömeceğimiz bilgiler (Claims).
            // Kullanıcının ID'sini ve E-postasını şifreli paketin içine koyuyoruz.
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            };

            // 2. Güvenlik Anahtarı (Token'ı kimse sahtesiyle değiştiremesin diye).
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["TokenOptions:SecurityKey"]));
            
            // 3. Şifreleme Algoritması (HMAC SHA-512 endüstri standartıdır).
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            // 4. Token'ın özelliklerini belirliyoruz (Kim üretti, ne zaman bitecek).
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // Token 7 gün geçerli olsun
                SigningCredentials = credentials
            };

            // 5. Fabrikadan Token'ı basıp string (metin) olarak teslim ediyoruz.
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}