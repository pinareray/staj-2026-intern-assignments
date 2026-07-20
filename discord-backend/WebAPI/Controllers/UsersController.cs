using Application.Features.Users.Commands.ChangePassword;
using Application.Features.Users.Commands.UpdateProfile;
using Application.Features.Users.Queries.GetProfile;
using Application.Features.Users.Queries.GetUserByUsername;
using Application.Features.Users.Queries.SearchUsers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UsersController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _mediator.Send(new GetProfileQuery());
            return Ok(profile);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            {
                return Ok(Array.Empty<object>());
            }

            var results = await _mediator.Send(new SearchUsersQuery
            {
                Query = q
            });
            return Ok(results);
        }

        [HttpGet("{username}")]
        public async Task<IActionResult> GetByUsername(string username)
        {
            try
            {
                var profile = await _mediator.Send(new GetUserByUsernameQuery
                {
                    Username = username
                });
                return Ok(profile);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command)
        {
            var profile = await _mediator.Send(command);
            return Ok(profile);
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
        {
            await _mediator.Send(command);
            return Ok(new { Message = "Şifre başarıyla güncellendi." });
        }
    }
}
