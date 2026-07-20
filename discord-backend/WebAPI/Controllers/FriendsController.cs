using Application.Features.Friends.Commands.AcceptRequest;
using Application.Features.Friends.Commands.AddFriend;
using Application.Features.Friends.Commands.RejectRequest;
using Application.Features.Friends.Queries.GetFriends;
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
    public class FriendsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public FriendsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetFriends()
        {
            var friends = await _mediator.Send(new GetFriendsQuery());
            return Ok(friends);
        }

        [HttpPost]
        public async Task<IActionResult> AddFriend([FromBody] AddFriendDto dto)
        {
            try
            {
                var result = await _mediator.Send(new AddFriendCommand
                {
                    Username = dto.Username
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("accept")]
        public async Task<IActionResult> AcceptRequest([FromBody] AcceptRequestDto dto)
        {
            try
            {
                var result = await _mediator.Send(new AcceptRequestCommand
                {
                    FriendshipId = dto.FriendshipId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reject")]
        public async Task<IActionResult> RejectRequest([FromBody] RejectRequestDto dto)
        {
            try
            {
                var result = await _mediator.Send(new RejectRequestCommand
                {
                    FriendshipId = dto.FriendshipId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
