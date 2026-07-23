using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Application.Common
{
    public static class MentionParser
    {
        private static readonly Regex MentionRegex = new(
            @"@([A-Za-z0-9çğıöşüÇĞİÖŞÜ._\-]+)",
            RegexOptions.Compiled);

        public static IReadOnlyList<string> ExtractUsernames(string? content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return [];
            }

            return MentionRegex.Matches(content)
                .Select(m => m.Groups[1].Value)
                .Where(u => !string.IsNullOrWhiteSpace(u))
                .Distinct(System.StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
