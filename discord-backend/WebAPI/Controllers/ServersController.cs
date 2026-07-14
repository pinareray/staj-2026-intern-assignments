using Application.Features.Servers.Queries.GetServers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    }
}
