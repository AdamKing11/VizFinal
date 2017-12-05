
var re = /^th(e$|anksg)/
var data = [];
for (var i = 0; i < data_full.length; i++) {
	if (re.exec(data_full[i].word)) {
		data.push(data_full[i])
	}
}

console.log(data.length)

function mod_year(y, m) { return (parseInt(y) + m).toString();	}

var cur_year = '1950'

var width = 700;
var height = 600;
var tl_height = 100;

var words_stats_w = 100;

var x_offset = 75;
var y_offset = 75;

var c = d3.select("#c");
var tl = d3.select("#tl");

var c_svg = c.append('svg')
    .attr("width", width)
    .attr("height", height);

var ws_svg = c.append('svg')
	.attr("width", words_stats_w)
	.attr("height", height);

var tl_svg = tl.append('svg')
	.attr("width", width)
	.attr("height", tl_height);

var x_scale = d3.scaleLinear()
	//.domain(d3.extent(data, function(d) { 
	//	return d.decs[cur_year].u.rank;
	//}))
	.domain([1,17000])
	.range([x_offset, width - x_offset ]);

var y_scale = d3.scaleLinear()
	//.domain(d3.extent(data, function(d) { 
	//	return d.decs[cur_year].t.rank;
	//}))
	.domain([1,17000])
	.range([height - y_offset, y_offset]);

var tl_scale = d3.scaleLinear()
	.domain([1800, 2000])
	.range([x_offset, width - x_offset]);

c_svg.append("g")
	.call(d3.axisBottom(x_scale))
	.attr("transform", "translate(0," + (height - y_offset) + ")");

c_svg.append("g")
	.call(d3.axisLeft(y_scale))
	.attr("transform", "translate(" + x_offset + ",0)");

tl_svg.append("g")
	.call(d3.axisBottom(tl_scale))
	.attr("transform", "translate(0," + (tl_height/2) + ")");

ws_svg.append("g")
	.append("text")
	.attr('text-anchor', 'middle')
	.attr('x', (words_stats_w/2))
	.attr('y', y_offset)
	.attr('class', 'word-stats-word')
	.text("----");

ws_svg.append("g")
	.append("text")
	.attr('text-anchor', 'middle')
	.attr('x', (words_stats_w/2))
	.attr('y', 1.25 * y_offset)
	.attr('class', 'word-stats-rank')
	.text("--");


function point_in_brush(px, py, brush_corners) {
	var x_lower = brush_corners[0][0], x_upper = brush_corners[1][0];
	var y_lower = brush_corners[0][1], y_upper = brush_corners[1][1];
	return ((px >= x_lower && px <= x_upper) &&
			(py >= y_lower && py <= y_upper));
}

var brush_corners;

var point_brush = d3.brush()
	.on('start', function(d) { 
		c_svg.selectAll('circle')
			.attr('fill-opacity', 1)
			.attr('fill', 'black');

		c_svg.selectAll('path')
			.attr("stroke", "url(#linear-gradient)");
	})
	.on('brush', function(d) {
		// gives back the top left corner and bottom right
		brush_corners = d3.event.selection;
		
		// make non-brushed points grayed out
		c_svg.selectAll('circle')
			.attr('fill-opacity', .3);

		var brushed_words = [];
		c_svg.selectAll('circle')
			.filter(function(e) { 
				var u_rank = x_scale(e.decs[cur_year].u.rank), t_rank = y_scale(e.decs[cur_year].t.rank);
				var should_highlight = point_in_brush(u_rank, t_rank, brush_corners);
				if (should_highlight) { brushed_words.push(e.word); } 
				return should_highlight;
			})
			.attr('fill-opacity', 1)
			.attr('fill', 'red');
		
		//c_svg.selectAll('path')
		//	.filter(function(e) {
		//		var u_rank = x_scale(e.decs[cur_year].u.rank), t_rank = y_scale(e.decs[cur_year].t.rank);
		//		return point_in_brush(u_rank, t_rank, brush_corners);
		//	})
		//	.attr("stroke", "url(#brushed-linear-gradient)");

		console.log(brushed_words);

	})
  
c_svg.append('g')
	.attr('class', 'brush')
	.call(point_brush);


var tl_brush_ext = [cur_year, parseInt(cur_year) + 10];


function move_tl_brush(d, new_year) {
	if (new_year === undefined) {
		var tb_loc = d3.event.selection;
		tl_brush_ext = tb_loc.map(tl_scale.invert);
		new_year = (tl_brush_ext[0] + tl_brush_ext[1])/2;
		new_year = Math.round(new_year/10) * 10;
	}
	if (new_year >= 1800 & new_year <= 2000) {
		var time_passed = cur_year - new_year;
		cur_year = new_year.toString();
			
		c_svg.selectAll("circle")
			.transition()
			.duration(500)
			.attr('cx', function(d) { return x_scale(d.decs[cur_year].u.rank) })
			.attr('cy', function(d) { return y_scale(d.decs[cur_year].t.rank) });

		////////////////////////////////////////
		c_svg.selectAll(".word-group")
			.selectAll("path")
			.attr("d", function(d) {
				var x_hist_scale = x_scale;
				var y_hist_scale = y_scale;
				p = 'M' + x_hist_scale(d.decs[cur_year].u.rank) + ' ' + y_hist_scale(d.decs[cur_year].t.rank); 
				for (var i = 1; i <= 5; i ++) {
					var new_hist_year = mod_year(cur_year, -10 * i)
				
					p += ' L' + x_hist_scale(d.decs[new_hist_year].u.rank) + ' ' + y_hist_scale(d.decs[new_hist_year].t.rank);
				}
				return p;
			})
			.attr("stroke-opacity", 0)
			.attr("stroke", "url(#linear-gradient)")
			.transition()
			.delay(500)
			.duration(500)
			.attr("stroke-opacity", 1)
			.filter(function(d) {
				var u_rank = x_scale(d.decs[cur_year].u.rank), t_rank = y_scale(d.decs[cur_year].t.rank);
				return point_in_brush(u_rank, t_rank, brush_corners);
			})
			.attr("stroke", "url(#brushed-linear-gradient)");
		////////////////////////////////////////
	}
}

var tl_brush = d3.brushX()
	//.extent([[x_scale(1700),0], [x_scale(2100),tl_height]])
	.filter(function () {return d3.mouse(this)[0] > tl_scale(tl_brush_ext[0]) && d3.mouse(this)[0] < tl_scale(tl_brush_ext[1])})
	.on('brush end', function(d) { move_tl_brush(d) } );

var tl_bg = tl_svg.append('g')
	.call(tl_brush)
	.attr('class', 'tl-brush')
	.call(tl_brush.move, [cur_year-5, parseInt(cur_year) + 5].map(tl_scale));

tl_svg.selectAll('.tl-brush>.handle').remove();


function move_tl_slider(new_year, dur) {
	if (dur === undefined) {
		dur = 500;
	}
	tl_bg.transition()
		.duration(dur)
		.call(tl_brush.move, [new_year, new_year].map(tl_scale));
}

function whole_tl() {
	move_tl_slider(1990, 3000);
	//
}

var linearGradient = c_svg.append("defs")
	.append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", "0%")
   	.attr("y1", "0%")
   	.attr("x2", "100%")
   	.attr("y2", "0%");

linearGradient.append("stop")
	.attr("offset", "0%")
	.attr("stop-color", "white");

linearGradient.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", "black");

var brushed_linearGradient = c_svg.select("defs")
	.append("linearGradient")
    .attr("id", "brushed-linear-gradient")
    .attr("x1", "0%")
   	.attr("y1", "0%")
   	.attr("x2", "100%")
   	.attr("y2", "0%");

brushed_linearGradient.append("stop")
	.attr("offset", "0%")
	.attr("stop-color", "white");

brushed_linearGradient.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", "red");


console.log(cur_year);
///////////////////////////////////////////////////////////////
c_svg.selectAll("circle")
	.data(data)
	.enter()
	.append("g")
	.attr('class', 'word-group')
	.append("circle")
	.attr('class', 'point-mouseoff')
	.attr('cx', function(d) { return x_scale(d.decs[cur_year].u.rank) })
	.attr('cy', function(d) { return y_scale(d.decs[cur_year].t.rank) })
	.attr('fill', 'black')
	.on('mouseover click', function(d) {
		d3.select(this)
			.attr('class', 'point-mouseon');
			
		ws_svg.selectAll('.word-stats-word')
			.transition()
			.duration(500)
			.text(d.word);

		ws_svg.selectAll('.word-stats-rank')
			.transition()
			.duration(500)
			.text(d.decs[cur_year].u.rank + ', ' + d.decs[cur_year].t.rank);
	})
	.on('mouseout', function(d) { 
		d3.select(this)
			.attr('class', 'point-mouseoff');
			//.attr('fill', 'black');

		ws_svg.selectAll('.word-stats-word')
			.transition()
			.duration(500)
			.text('----');

		ws_svg.selectAll('.word-stats-rank')
			.transition()
			.duration(500)
			.text('--')
	});
	
c_svg.selectAll(".word-group")
	.append("path")
	.attr("stroke", "url(#linear-gradient)")
	.attr("stroke-dasharray", "5,5")
	.attr("fill", "none");