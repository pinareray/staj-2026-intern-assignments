using Application.Features.Moderation.Commands.BlockUser;
using Application.Features.Moderation.Commands.ReportUser;
using Application.Features.Moderation.Commands.ReviewReport;
using Application.Features.Moderation.Commands.UnblockUser;
using Application.Features.Moderation.Queries.GetBlockStatus;
using Application.Features.Moderation.Queries.GetReports;
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
    public class ModerationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ModerationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("blocks/{userId:guid}")]
        public async Task<IActionResult> GetBlockStatus(Guid userId)
        {
            var result = await _mediator.Send(new GetBlockStatusQuery { UserId = userId });
            return Ok(result);
        }

        [HttpPost("blocks/{userId:guid}")]
        public async Task<IActionResult> Block(Guid userId)
        {
            try
            {
                var result = await _mediator.Send(new BlockUserCommand { UserId = userId });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("blocks/{userId:guid}")]
        public async Task<IActionResult> Unblock(Guid userId)
        {
            try
            {
                var result = await _mediator.Send(new UnblockUserCommand { UserId = userId });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reports")]
        public async Task<IActionResult> Report([FromBody] ReportUserDto dto)
        {
            try
            {
                var result = await _mediator.Send(new ReportUserCommand
                {
                    UserId = dto.UserId,
                    Reason = dto.Reason,
                    Details = dto.Details
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports([FromQuery] string? status = null)
        {
            try
            {
                var result = await _mediator.Send(new GetReportsQuery { Status = status });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("reports/{reportId:guid}/review")]
        public async Task<IActionResult> Review(Guid reportId, [FromBody] ReviewReportDto dto)
        {
            try
            {
                var result = await _mediator.Send(new ReviewReportCommand
                {
                    ReportId = reportId,
                    Status = dto.Status,
                    AdminNote = dto.AdminNote
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class ReportUserDto
    {
        public Guid UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
    }

    public class ReviewReportDto
    {
        public string Status { get; set; } = "Reviewed";
        public string? AdminNote { get; set; }
    }
}
