$(function() {

	init();

	function init() {
		getServerChart();
	}

	// 获取 各服务器进程状态；
	function getServerChart() {
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Supervisord/processNum",
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					initPieChart(res.data);
				}
			}
		})
	}

	// 各服务器 进程启用状态 饼图
	function initPieChart(data) {
		var series = [];
		var radius = [60, 75];
		var seriesObj = {
			type: 'pie',
			radius: radius,
			itemStyle: labelFromatter,
		};

		var seriesData = function(data) {
			var series = [];
			var radius = [60, 75];
			for (var i = 0; i < data.length; i++) {
				var total = data[i].open + data[i].close;
				var openPercent = ((data[i].open / total) * 100).toFixed(2);
				var closePercent = 100 - openPercent;
				var centerX = (10 + i * 20) + '%';
				var centerY = i < 5 ? '57.5%' : '82.5%'; // 2排 32.5%,82.5%
				var seriesObj = {
					name: data[i].serverName,
					type: 'pie',
					center: [centerX, centerY],
					radius: radius,
					itemStyle: labelFromatter,
					data: [{
						name: '未启用',
						value: closePercent,
						itemStyle: labelBottom
					}, {
						name: data[i].serverName + '已启用',
						value: openPercent,
						itemStyle: labelTop
					}]
				};
				series.push(seriesObj);
			}
			return series;
		}

		var tooltipFormatter = function(svName, isOpen) {
				var html = '';
				for (var i = 0; i < data.length; i++) {
					if (data[i].serverName == svName) {
						if (isOpen) {
							html = data[i].serverName + '<br>共 ' + (data[i].open + data[i].close) + ' 个进程<br>已启用：' + data[i].open + '个';
						} else {
							html = data[i].serverName + '<br>共 ' + (data[i].open + data[i].close) + ' 个进程<br>未启用：' + data[i].close + '个';
						}
						return html;
					}
				}
				return html;
			}
		// 初始化 charts multiple_donuts
		var multiple_donuts = echarts.init(document.getElementById('multiple_donuts'), EchartTheam);

		// 百分数 Top text label
		var labelTop = {
			normal: {
				label: {
					show: true,
					position: 'center',
					// formatter: '{b}\n',
					formatter: '{c}%\n',
					textStyle: {
						baseline: 'middle',
						fontWeight: 300,
						fontSize: 15
					}
				},
				labelLine: {
					show: false
				}
			}
		};

		// 服务器名称 Format bottom label
		var labelFromatter = {
			normal: {
				label: {
					formatter: function(params) {
						return '\n\n' + params.seriesName // 服务器名称
					}
				}
			}
		}

		// Bottom text label
		var labelBottom = {
			normal: {
				color: '#a4b2bb',
				label: {
					show: true,
					position: 'center',
					textStyle: {
						baseline: 'middle'
					}
				},
				labelLine: {
					show: false
				}
			},
			emphasis: {
				color: '#aebcc5'
			}
		};
		// 配置 options
		var multiple_donuts_options = {

			// 添加 标题
			title: {
				text: '各服务器 进程启用状态 分布图',
				// subtext: 'from global web index',
				x: 'center'
			},

			// 添加 legend ：未起作用
			legend: {
				x: 'center',
				y: '56%',
				data: ['服务一', '服务二', '服务三', '服务4']
			},

			// 添加 tooltip
			tooltip: {
				trigger: 'item',
				backgroundColor: 'rgba(0,0,0,0.8)',
				formatter: function(params, ticket, callback) {
					var isOpen = true;
					if (params.name == "未启用") {
						isOpen = false;
					}
					return tooltipFormatter(params.seriesName, isOpen);
				}
			},

			// 添加 series
			series: seriesData(data)
		};

		// 应用配置 options
		multiple_donuts.setOption(multiple_donuts_options);

		// Resize charts
		window.onresize = function() {
			setTimeout(function() {
				multiple_donuts.resize();
			}, 200);
		}
	}


	// 各服务器进程启用状态分布图 刷新；
	$('.reload_serverNum').on('click', function() {
		var pro_panel = $('#serverNum-diagram');
		pro_panel.block({
			message: '<i class="icon-spinner9 spinner"></i>',
			overlayCSS: {
				backgroundColor: '#fff',
				opacity: 0.8,
				cursor: 'wait'
			},
			css: {
				border: 0,
				padding: 0,
				backgroundColor: 'none'
			}
		});
		window.setTimeout(function() {
			pro_panel.unblock();
		}, 1000);

		// 重新请求数据；
		getServerChart();

	});
});