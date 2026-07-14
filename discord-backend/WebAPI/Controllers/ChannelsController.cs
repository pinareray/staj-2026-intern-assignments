using Application.Features.Channels.Commands.CreateChannel;
using Application.Features.Channels.Queries.GetChannelsByServer;
using Application.Features.Messages.Queries.GetMessagesByChannel;
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
    public class ChannelsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ChannelsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // GET api/channels?serverId=...
        [HttpGet]
        public async Task<IActionResult> GetByServer([FromQuery] Guid serverId)
        {
            var channels = await _mediator.Send(new GetChannelsByServerQuery
            {
                ServerId = serverId
            });
            return Ok(channels);
        }

        // GET api/channels/{channelId}/messages
        [HttpGet("{channelId:guid}/messages")]
        public async Task<IActionResult> GetMessages(Guid channelId)
        {
            var messages = await _mediator.Send(new GetMessagesByChannelQuery
            {
                ChannelId = channelId
            });
            return Ok(messages);
        }

        [HttpPost]
        public async Task<IActionResult> CreateChannel([FromBody] CreateChannelDto dto)
        {
            var channel = await _mediator.Send(new CreateChannelCommand
            {
                Name = dto.Name,
                ServerId = dto.ServerId,
                Type = dto.Type
            });

            return Ok(channel);
        }
    }
}
