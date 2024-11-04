onload = function () {
    let curr_data, V, src, dst;

    const container = document.getElementById('mynetwork');
    const container2 = document.getElementById('mynetwork2');
    const genNew = document.getElementById('generate-graph');
    const solve = document.getElementById('solve');
    const temptext = document.getElementById('temptext');
    const temptext2 = document.getElementById('temptext2');
    const cities = ['Delhi', 'Mumbai', 'Gujarat', 'Goa', 'Kanpur', 'Jammu', 
        'Hyderabad', 'Bangalore', 'Gangtok', 'Meghalaya', 'America',
        'Tokyo', 'New York', 'London', 'Paris', 'Berlin', 'Sydney',
        'Toronto', 'Beijing', 'Moscow', 'Cairo', 'Rio de Janeiro', 
        'Cape Town', 'Buenos Aires', 'Mexico City', 'Seoul', 'Singapore',
        'Bangkok', 'Lisbon', 'Rome', 'Amsterdam', 'Dublin', 
        'Vienna', 'Athens', 'Hanoi', 'Kuala Lumpur', 'Brisbane'];

    // Initialize graph options
    const options = {
        edges: {
            color: { 
                color: '#1E90FF',      // Primary color of the edge
                highlight: '#FFD700',  // Color when edge is highlighted
                hover: '#FF4500'       // Color when edge is hovered over
            },
            labelHighlightBold: true,
            font: { size: 20 }
        },
        nodes: {
            font: { color: '#000000', size: 14 },
            shape: 'icon',
            icon: {
                face: 'FontAwesome',
                code: '\uf015',
                size: 40,
                color: '#8A2BE2',
            }
        }
    };

    // Initialize networks for displaying graphs
    const network = new vis.Network(container);
    network.setOptions(options);
    const network2 = new vis.Network(container2);
    network2.setOptions(options);

    // Function to create random graph data
    function createData() {
        V = Math.floor(Math.random() * 20) + 2; // Ensures V is between 2 and 21
        let nodes = [];
        for (let i = 1; i <= V; i++) {
            nodes.push({ id: i, label: cities[i - 1] });
        }
        nodes = new vis.DataSet(nodes);

        // Initialize edges array
        let edges = [];
        
        // Create a basic connected graph structure
        for (let i = 2; i <= V; i++) {
            let neigh = i - Math.floor(Math.random() * Math.min(i - 1, 3) + 1);
            edges.push({ type: 0, from: i, to: neigh, color: 'orange', label: String(Math.floor(Math.random() * 70) + 31) });
        }

        // Randomly add additional edges
        for (let i = 0; i < Math.floor(V / 2);) {
            let n1 = Math.floor(Math.random() * V) + 1;
            let n2 = Math.floor(Math.random() * V) + 1;

            if (n1 !== n2) {
                // Ensure unique edges
                if (!edges.some(edge => (edge.from === n1 && edge.to === n2) || (edge.from === n2 && edge.to === n1))) {
                    let type = Math.random() < 0.5 ? 0 : 1; // 50% chance for bus or plane
                    edges.push({
                        type: type,
                        from: n1,
                        to: n2,
                        color: type === 0 ? 'orange' : 'green',
                        label: String(Math.floor(Math.random() * (type === 0 ? 70 : 50)) + 1)
                    });
                    i++;
                }
            }
        }

        // Random source and destination
        src = Math.floor(Math.random() * V) + 1;
        dst = Math.floor(Math.random() * V) + 1;

        while (dst === src) {
            dst = Math.floor(Math.random() * V) + 1;
        }

        curr_data = { nodes: nodes, edges: edges };
    }

    genNew.onclick = function () {
        createData();
        network.setData(curr_data);
        temptext2.innerText = 'Find least time path from ' + cities[src - 1] + ' to ' + cities[dst - 1];
        temptext.style.display = "inline";
        temptext2.style.display = "inline";
        container2.style.display = "none";
    };

    solve.onclick = function () {
        temptext.style.display = "none";
        temptext2.style.display = "none";
        container2.style.display = "inline";
        network2.setData(solveData());
    };

    // Dijkstra's algorithm implementation
    function djikstra(graph, sz, src) {
        let vis = Array(sz).fill(false);
        let dist = Array.from({ length: sz }, () => [Infinity, -1]); // Use Infinity for max distance
        dist[src][0] = 0;

        for (let i = 0; i < sz - 1; i++) {
            let mn = -1;
            for (let j = 0; j < sz; j++) {
                if (!vis[j] && (mn === -1 || dist[j][0] < dist[mn][0])) {
                    mn = j; // Find the unvisited vertex with the smallest distance
                }
            }

            vis[mn] = true; // Mark the vertex as visited
            for (let edge of graph[mn]) {
                let [neighbor, weight] = edge;
                if (!vis[neighbor] && dist[mn][0] + weight < dist[neighbor][0]) {
                    dist[neighbor][0] = dist[mn][0] + weight;
                    dist[neighbor][1] = mn; // Track the previous vertex
                }
            }
        }

        return dist;
    }

    // Function to create the graph adjacency list
    function createGraph(data) {
        let graph = Array.from({ length: V }, () => []); // Initialize empty adjacency list
        for (let edge of data.edges) {
            if (edge.type === 1) continue; // Ignore plane edges
            graph[edge.from - 1].push([edge.to - 1, parseInt(edge.label)]);
            graph[edge.to - 1].push([edge.from - 1, parseInt(edge.label)]);
        }
        return graph;
    }

    // Function to determine if a plane should be used for the route
    function shouldTakePlane(edges, dist1, dist2, mn_dist) {
        let plane = 0;
        let p1 = -1, p2 = -1;

        for (let edge of edges) {
            if (edge.type === 1) { // If the edge is a plane
                let to = edge.to - 1;
                let from = edge.from - 1;
                let weight = parseInt(edge.label);
                // Check both routes with the plane
                if (dist1[to][0] + weight + dist2[from][0] < mn_dist) {
                    plane = weight;
                    p1 = to;
                    p2 = from;
                    mn_dist = dist1[to][0] + weight + dist2[from][0];
                }
                if (dist2[to][0] + weight + dist1[from][0] < mn_dist) {
                    plane = weight;
                    p2 = to;
                    p1 = from;
                    mn_dist = dist2[to][0] + weight + dist1[from][0];
                }
            }
        }
        return { plane, p1, p2 };
    }

    // Main function to solve the problem
    function solveData() {
        const data = curr_data;
        const graph = createGraph(data);

        // Get distances from source and destination using Dijkstra's algorithm
        let dist1 = djikstra(graph, V, src - 1);
        let dist2 = djikstra(graph, V, dst - 1);

        let mn_dist = dist1[dst - 1][0]; // Initial minimum distance

        // Check if a plane should be used
        let { plane, p1, p2 } = shouldTakePlane(data.edges, dist1, dist2, mn_dist);

        let new_edges = [];
        if (plane !== 0) {
            new_edges.push({ arrows: { to: { enabled: true } }, from: p1 + 1, to: p2 + 1, color: 'green', label: String(plane) });
            new_edges.push(...pushEdges(dist1, p1, false));
            new_edges.push(...pushEdges(dist2, p2, true));
        } else {
            new_edges.push(...pushEdges(dist1, dst - 1, false));
        }

        return { nodes: data.nodes, edges: new_edges };
    }

    // Function to construct edges for the path from the distances
    function pushEdges(dist, curr, reverse) {
        let tmp_edges = [];
        while (dist[curr][0] !== 0) {
            let from = dist[curr][1];
            if (reverse) {
                tmp_edges.push({ arrows: { to: { enabled: true } }, from: curr + 1, to: from + 1, color: 'orange', label: String(dist[curr][0] - dist[from][0]) });
            } else {
                tmp_edges.push({ arrows: { to: { enabled: true } }, from: from + 1, to: curr + 1, color: 'orange', label: String(dist[curr][0] - dist[from][0]) });
            }
            curr = from;
        }
        return tmp_edges;
    }
};
