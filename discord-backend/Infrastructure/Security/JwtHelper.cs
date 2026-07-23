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
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username)
            };

            if (user.IsPlatformAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "PlatformAdmin"));
            }

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

            // Oturum: kullanıcı çıkış yapana / veriyi temizleyene kadar uzun süre geçerli kalsın.
            var daysRaw = _configuration["TokenOptions:AccessTokenExpirationDays"];
            var days = 90;
            if (int.TryParse(daysRaw, out var parsedDays) && parsedDays > 0)
            {
                days = parsedDays;
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(days),
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