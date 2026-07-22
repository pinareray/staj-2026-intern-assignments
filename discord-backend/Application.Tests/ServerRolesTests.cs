using Application.Common;
using Xunit;

namespace Application.Tests;

public class ServerRolesTests
{
    [Theory]
    [InlineData("Owner", true)]
    [InlineData("owner", true)]
    [InlineData("Admin", true)]
    [InlineData("Member", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void CanManageChannels_returns_expected(string? role, bool expected)
    {
        Assert.Equal(expected, ServerRoles.CanManageChannels(role));
    }
}
