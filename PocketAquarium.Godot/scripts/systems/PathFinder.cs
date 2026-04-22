using System;
using System.Collections.Generic;
using System.Linq;
using PocketAquarium;

namespace PocketAquarium.Systems;

public static class PathFinder
{
    public static IReadOnlyList<TileCoord> TilesBetween(
        TileCoord from,
        TileCoord to,
        ISet<TileCoord> walkable
    )
    {
        if (from == to)
            return new[] { from };

        var queue = new Queue<List<TileCoord>>();
        var seen = new HashSet<TileCoord> { from };
        queue.Enqueue(new List<TileCoord> { from });

        var directions = new[]
        {
            new TileCoord(1, 0),
            new TileCoord(-1, 0),
            new TileCoord(0, 1),
            new TileCoord(0, -1),
        };

        while (queue.Count > 0)
        {
            var path = queue.Dequeue();
            var tail = path[^1];
            if (tail == to)
                return path;

            foreach (var direction in directions)
            {
                var next = new TileCoord(tail.Col + direction.Col, tail.Row + direction.Row);
                if (seen.Contains(next))
                    continue;

                if (!walkable.Contains(next) && next != to)
                    continue;

                var nextPath = path.Append(next).ToList();
                seen.Add(next);
                queue.Enqueue(nextPath);
            }
        }

        return Array.Empty<TileCoord>();
    }
}
