using Application.Features.Channels.Queries.GetChannelsByServer;
using Application.Features.Servers.Commands.CreateServer;
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

        // GET api/servers/{serverId}/channels
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
    }
}
