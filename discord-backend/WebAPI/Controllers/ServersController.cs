using Application.Features.Channels.Queries.GetChannelsByServer;
using Application.Features.Servers.Commands.AcceptInvite;
using Application.Features.Servers.Commands.AddMember;
using Application.Features.Servers.Commands.CreateServer;
using Application.Features.Servers.Commands.LeaveServer;
using Application.Features.Servers.Commands.RejectInvite;
using Application.Features.Servers.Commands.RemoveMember;
using Application.Features.Servers.Queries.GetMyInvites;
using Application.Features.Servers.Queries.GetServerMembers;
using Application.Features.Servers.Queries.GetServerPendingInvites;
using Application.Features.Servers.Queries.GetServers;
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
    public class ServersController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ServersController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetServers()
        {
            var servers = await _mediator.Send(new GetServersQuery());
            return Ok(servers);
        }

        [HttpGet("invites")]
        public async Task<IActionResult> GetMyInvites()
        {
            var invites = await _mediator.Send(new GetMyServerInvitesQuery());
            return Ok(invites);
        }

        [HttpPost("invites/{inviteId:guid}/accept")]
        public async Task<IActionResult> AcceptInvite(Guid inviteId)
        {
            try
            {
                var result = await _mediator.Send(new AcceptServerInviteCommand
                {
                    InviteId = inviteId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("invites/{inviteId:guid}/reject")]
        public async Task<IActionResult> RejectInvite(Guid inviteId)
        {
            try
            {
                var result = await _mediator.Send(new RejectServerInviteCommand
                {
                    InviteId = inviteId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{serverId:guid}/channels")]
        public async Task<IActionResult> GetChannels(Guid serverId)
        {
            var channels = await _mediator.Send(new GetChannelsByServerQuery
            {
                ServerId = serverId
            });
            return Ok(channels);
        }

        [HttpPost]
        public async Task<IActionResult> CreateServer([FromBody] CreateServerDto dto)
        {
            var server = await _mediator.Send(new CreateServerCommand
            {
                Name = dto.Name
            });

            return Ok(server);
        }

        [HttpGet("{serverId:guid}/members")]
        public async Task<IActionResult> GetMembers(Guid serverId)
        {
            try
            {
                var result = await _mediator.Send(new GetServerMembersQuery
                {
                    ServerId = serverId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{serverId:guid}/invites")]
        public async Task<IActionResult> GetServerInvites(Guid serverId)
        {
            try
            {
                var result = await _mediator.Send(new GetServerPendingInvitesQuery
                {
                    ServerId = serverId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{serverId:guid}/members")]
        public async Task<IActionResult> AddMember(Guid serverId, [FromBody] AddServerMemberDto dto)
        {
            try
            {
                var result = await _mediator.Send(new AddServerMemberCommand
                {
                    ServerId = serverId,
                    Username = dto.Username
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{serverId:guid}/members/{userId:guid}")]
        public async Task<IActionResult> RemoveMember(Guid serverId, Guid userId)
        {
            try
            {
                var result = await _mediator.Send(new RemoveServerMemberCommand
                {
                    ServerId = serverId,
                    UserId = userId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{serverId:guid}/leave")]
        public async Task<IActionResult> Leave(Guid serverId)
        {
            try
            {
                var result = await _mediator.Send(new LeaveServerCommand
                {
                    ServerId = serverId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class AddServerMemberDto
    {
        public string Username { get; set; } = string.Empty;
    }
}
