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
            var securityKey = _configuration["TokenOptions:SecurityKey"]
                ?? throw new InvalidOperationException("TokenOptions:SecurityKey yapılandırması eksik.");

            if (Encoding.UTF8.GetByteCount(securityKey) < 64)
            {
                throw new InvalidOperationException(
                    "TokenOptions:SecurityKey en az 64 karakter olmalı (HMAC-SHA512 gereksinimi).");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(securityKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = _configuration["TokenOptions:Issuer"],
                Audience = _configuration["TokenOptions:Audience"],
                SigningCredentials = credentials
            };

            // 5. Fabrikadan Token'ı basıp string (metin) olarak teslim ediyoruz.
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}