$(function() {

	//全局变量；
	var SERVER = '';
	var BUSINESS = '';
	var PRO_datatable;
	var URL_Port = 'http://10.99.1.155:81';
	var isPositiveInteger = /^[0-9]*[1-9][0-9]*$/; // 是否为正整数
	var isInteger = /^[0-9]+.?[0-9]*$/; // 是否为数字

	// 初始化；
	init();

	function init() {
		getProgressData();
		getServerMenu();
	}

	/*
	 * 简易弹出框-代替alert
	 * @title 标题 0为默认：友情提示
	 * @text 弹出框文本
	 */
	function warningModal(title, text) {
		var wM = $('#warningModal');
		if (title != 0) {
			$('#warningModalLabel').text(title);
		}
		$('#warningModalLabel_text').text(text);
		wM.modal('show');
		$('.modal-backdrop:last-child').css('z-index', '1050'); // 重叠modal时在最上层显示；
	}

	// 悬挂菜单 数据获取
	function getServerMenu() {
		$.ajax({
			type: "get",
			url: URL_Port + "/Rpc/Supervisord/eachServer",
			dataType: 'json',
			success: function(res) {
				var serverHtml = '';
				var menuHtml = ''; // 悬挂菜单 html
				if (res.status == 1) {
					for (var i = 0; i < res.data.length; i++) {
						menuHtml += ['<div class="sidebar-category" data-server="' + res.data[i].serverName + '">',
							'<div class="category-title">',
							'<span class="svName">' + res.data[i].serverName + '</span>',
							'<ul class="icons-list">',
							'<li><a href="#" data-action="collapse" data-index="' + i + '"></a></li>',
							'</ul>',
							'</div>'
						].join('');
						if (res.data[i].business) {

							menuHtml += '<div class="category-content no-padding"><ul class="navigation navigation-alt navigation-accordion">';
							for (var j = 0; j < res.data[i].business.length; j++) {
								menuHtml += '<li><a class="navigation_server_a" href="#"><i class="icon-server"></i>' + res.data[i].business[j] + '</a></li>';

							}
							menuHtml += '</div></ul>'
						}
						menuHtml += '</div>';

						serverHtml += '<li><a href="javascript:void(0)">' + res.data[i].serverName + '</a></li>';
					}
					$('.navigation_server').append(menuHtml);
					$('.sel_server_ul').append(serverHtml); // 添加进程 modal server select;
				}
			}
		})
	}

	// 悬挂菜单 隐藏与显示
	$('.navigation_server').on('click', '.icons-list a[data-action]', function() {
		var index = $(this).attr('data-index');
		var categoryContent = $('.navigation_server .sidebar-category').eq(index).find('.category-content');
		var contentH = categoryContent.find('li').length * 44 + 'px';
		if ($(this).hasClass('rotate-180')) {
			$(this).removeClass('rotate-180');
			categoryContent.animate({
				height: contentH
			}, 200);
		} else {
			$(this).addClass('rotate-180');
			$('.navigation_server .sidebar-category').eq(index).find('.category-content').animate({
				height: 0
			}, 200);
		}
	})


	// 默认设置 datatable
	$.extend($.fn.dataTable.defaults, {
		autoWidth: false,
		dom: '<"datatable-header"fl><"datatable-scroll"t><"datatable-footer"ip>',
		language: {
			search: '<span>查询:</span> _INPUT_',
			lengthMenu: '<span>Show:</span> _MENU_',
			paginate: {
				'first': 'First',
				'last': 'Last',
				'next': '&rarr;',
				'previous': '&larr;'
			}
		},
		drawCallback: function() {
			$(this).find('tbody tr').slice(-3).find('.dropdown, .btn-group').addClass('dropup');
		},
		preDrawCallback: function() {
			$(this).find('tbody tr').slice(-3).find('.dropdown, .btn-group').removeClass('dropup');
		}
	});

	/*
	 * 服务器 所有进程列表数据展示
	 * @programs 数组，包含服务器名svName 的进程数组;
	 */
	function progressDatatable(programs) {
		var rows = []; // 数据数组
		for (var i = 0; i < programs.length; i++) {
			var row = {};
			row.svName = '<a class="td_pro_server">' + programs[i].svName + '</a>';
			row.busyName = '<span class="td_pro_business">' + programs[i].busyName + '</span>';
			row.proName = '<span class="td_pro_progress">' + programs[i].group + ':' + programs[i].name + '</span>';
			row.proDesc = programs[i].description;
			row.group = programs[i].group;
			if (programs[i].state == 20) { // running
				row.proState = '<span class="label label-success">' + programs[i].statename + '</span>';
			} else if (programs[i].state == 0) { // stopped
				row.proState = '<span class="label label-danger">' + programs[i].statename + '</span>';
			} else {
				row.proState = '<span class="label label-info">' + programs[i].statename + '</span>';
			}
			rows.push(row);
		};

		PRO_datatable = $('.datatable_progress').DataTable({ // dataTable
			data: rows,
			destroy: true,
			columns: [{
				data: 'group'
			}, {
				data: 'svName'
			}, {
				data: 'busyName'
			}, {
				data: 'proName'
			}, {
				data: 'proDesc'
			}, {
				data: 'proState'
			}],
			columnDefs: [{
				orderable: false,
				targets: [5]
			}, {
				orderable: false,
				targets: [6],
				data: null,
				defaultContent: [
					'<a class="pro-action td_action_start" href="javascript:void(0);">启动</a>',
					'<a class="pro-action td_action_stop" href="javascript:void(0);">停止</a>',
					'<a class="pro-action td_action_restart" href="javascript:void(0);">重启</a>',
					// '<a class="pro-action td_action_reload" href="javascript:void(0);">重载</a>'
					// '<a class="pro-action td_action_delete" href="javascript:void(0);">删除</a>'
				].join('')
			}],
			drawCallback: function(settings) { // 分组显示
				var api = this.api();
				var rows = api.rows({
					page: 'current'
				}).nodes();
				var last = null;

				api.column(0, {
					page: 'current'
				}).data().each(function(group, i) {
					var serverName = $(rows).eq(i).find('.td_pro_server').text(); // 同时按照 不同服务器 分组；
					if (last !== (serverName + group)) {
						$(rows).eq(i).before(
							'<tr class="group" data-group-index="' + i + '">' 
							+ '<td colspan="2">进程组：<span class="pro_group">' + group + '</span></td>' 
							+ '<td colspan="4">' 
							+ '<a class="pro-action-group td_action_groupReload" href="javascript:void(0);"><i class="icon-google-drive"></i>重载</a>' 
							+ '<a class="pro-action-group td_action_groupDel" href="javascript:void(0);"><i class="icon-bin"></i>组删除</a>' 
							+ '<a class="pro-action-group td_action_groupEdit" href="javascript:void(0);" data-toggle="modal" data-target="#editProgressGroupModal"><i class="icon-pencil7"></i>组配置修改</a>' 
							+ '<a class="pro-action-group td_action_groupStop" href="javascript:void(0);"><i class="icon-spam"></i>组停止</a>' 
							+ '<a class="pro-action-group td_action_groupStart" href="javascript:void(0);"><i class="icon-switch"></i>组启动</a>' 
							+ '</td>' + '</tr>'
						);

						last = serverName + group;
					}
				});
			}
		});

		PRO_datatable.column(0).visible(false); // 隐藏第一列；

	}

	/*
	 * 进程所有数据
	 */
	function getProgressData() {
		var data = [];
		$.ajax({
			type: "get",
			url: URL_Port + "/Rpc/Supervisord/index",
			dataType: 'json',
			success: function(json) {
				if (json.status == 1) {
					var serverHtml = '';
					var programs = [];
					for (var i in json.data) {
						if (json.data[i].process) { // 某业务无进程的情况
							for (var j = 0; j < json.data[i].process.length; j++) {
								var program = json.data[i].process[j];
								program.group = json.data[i].group;
								program.busyName = json.data[i].business;
								program.svName = json.data[i].serverName;
								programs.push(program);
							}
						}
					}
					progressDatatable(programs);

				} else {
					warningModal('错误信息', json.data);
				}
			}
		})
	}

	/*
	 * 获取 单个服务下进程数据
	 */
	function getServerProgressData() {
		if (SERVER == '' || BUSINESS == '') return; // 必须字段；
		$.ajax({
			type: "get",
			url: URL_Port + "/Rpc/Supervisord/businessInfo",
			data: {
				serverName: SERVER,
				business: BUSINESS
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					var programs = [];
					for (var i = 0; i < res.data.length; i++) { // 业务级
						if (res.data[i].process) { // 某业务无进程的情况
							for (var j = 0; j < res.data[i].process.length; j++) { // 进程级
								var program = res.data[i].process[j];
								program.group = res.data[i].group;
								program.busyName = res.data[i].business;
								program.svName = res.data[i].serverName;
								programs.push(program);
							}
						}
					}
					progressDatatable(programs);
				} else {
					warningModal('错误信息', res.data);
					// 如果不存在，高亮全部；
				}
			}
		})
	}
	// 服务筛选：获取某一server下的的所有进程
	$('.navigation_server').on('click', '.navigation_server_a', function() {
		var _this = $(this);
		if (!_this.hasClass('active')) {
			$('.navigation_server .navigation_server_all').removeClass('active');
			$('.navigation_server .navigation li .navigation_server_a').removeClass('active');
			_this.addClass('active');
		}
		SERVER = _this.parent().parent().parent().siblings('.category-title').find('.svName').text();
		BUSINESS = _this.text();
		getServerProgressData();
		$('.pro-nav-toggle').css({
			'display': 'none'
		});

	});

	// 获取 所有进程
	$('.navigation_server_all').on('click', function() {
		var _this = $(this);
		if (!_this.hasClass('active')) {
			$('.navigation_server .navigation li .navigation_server_a').removeClass('active');
			_this.addClass('active');
		}
		getProgressData(false);
		SERVER = '';
		$('.pro-nav-toggle').css({ // 全部启动／停止
			'display': 'inline-block'
		});
	})


	// 表头点击事件；
	// 某一服务进程 全部启动 
	$('.pro_startAll').on('click', function() {
		if (SERVER == '') return;
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/startAll",
			data: {
				serverName: SERVER
			},
			dataType: 'json',
			success: function(res) {
				var table_rows = PRO_datatable.rows().data();
				if (res.status == '1') { // 启动成功；
					warningModal('0', '全部启动成功');
					for (var i = 0; i < table_rows.length; i++) { // 状态修改
						table_rows[i].proState = '<span class="label label-success">running</span>';
					};
					PRO_datatable.rows().invalidate().draw(); // 表格重绘，必须加 invalidate();
				} else {
					warningModal('错误信息', '启动失败');
				}
			}
		})
	})

	// 某一服务进程 全部停止
	$('.pro_stopAll').on('click', function() {
		if (SERVER == '') return;
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/stopAll",
			data: {
				serverName: SERVER
			},
			dataType: 'json',
			success: function(res) {
				var table_rows = PRO_datatable.rows().data();
				if (res.status == '1') {
					warningModal('0', '全部停止成功');
					for (var i = 0; i < table_rows.length; i++) { // 状态修改
						table_rows[i].proState = '<span class="label label-danger">stopped</span>';
					};
					PRO_datatable.rows().invalidate().draw(); // 表格重绘，必须加 invalidate();
				} else {
					warningModal('错误信息', '停止失败');
				}
			}
		})
	})

	// 数据刷新；
	$('.pro_refreshAll').on('click', function() {
		var pro_panel = $('#process_datatable');
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

		// 刷新表格 数据
		if (SERVER == '') {
			getProgressData();
		} else {
			getServerProgressData();
		}

	});

	// 添加进程
	$('.sel_server_ul').on('click', 'li', function() { // modal select
		$('#addProgressModal .sel_server_val').text($(this).text());
	})
	$('#addProgress').on('click', function() {
		var pro_server = $('#addProgressModal .sel_server_val'),
			pro_business = $('#addProgressModal .pro_business'),
			pro_worker = $('#addProgressModal .pro_worker'),
			pro_order = $('#addProgressModal .pro_order'),
			pro_user = $('#addProgressModal .pro_user'),
			pro_num = $('#addProgressModal .pro_num');

		if (pro_server.text() == '请选择服务器') {
			warningModal('0', '您还没有选择服务器');
		} else if (pro_business.val() == '' || pro_business.val().length > 20) {
			warningModal('0', '业务名 必须在1-20个字数内');
		} else if (pro_worker.val() == '' || pro_worker.val().length > 20) {
			warningModal('0', 'worker标识 必须在1-20个字数内');
		} else if (!isNaN(pro_worker.val())) {
			warningModal('0', 'worker标识不能为纯数字');
		} else if (pro_user.val() == '') {
			warningModal('0', '执行用户不能为空');
		} else if (pro_num.val() == '' || !isPositiveInteger.test(pro_num.val()) || pro_num.val() == 0) {
			warningModal('0', '进程数量 必须是大于0的正整数');
		} else {
			$.ajax({
				type: "post",
				url: URL_Port + "/Configure/Configure/doAddWorker",
				async: true,
				data: {
					serverName: pro_server.text(),
					business: pro_business.val(),
					workerName: pro_worker.val(),
					command: pro_order.val(),
					user: pro_user.val(),
					numprocs: pro_num.val()
				},
				dataType: 'json',
				success: function(res) {
					if (res.status == 1) {
						// 加载进度条
						var $pb = $('#process_panel_loader .progress-bar');
						var panel_loader_text = $('.panel_loader_text');
						$pb.attr('data-transitiongoal', $pb.attr('data-transitiongoal-backup'));
						$('#addProgressModal .modal-dialog').addClass('loader_dialog');
						$('#addProgressModal .panel_loader').css('display', 'block');
						$pb.progressbar({
							display_text: 'center'
						});
						// 取消加载进度条；
						setTimeout(function() {
							$('#addProgressModal').modal('hide');
							$('#addProgressModal .modal-dialog').removeClass('loader_dialog');
							$('#addProgressModal .panel_loader').css('display', 'none');
							$pb.attr('data-transitiongoal', 0).progressbar({
								display_text: 'center'
							});
							clearAddModal();
						}, 1000);

						// 添加成功之后，将业务添加到相应的server菜单下；
						$('.navigation_server .navigation li .navigation_server_a').removeClass('active');
						$('.navigation_server .navigation_server_all').removeClass('active');
						var busyHtml = '<li><a class="navigation_server_a active" href="#"><i class="icon-server"></i>' + pro_business.val() + '.ini</a></li>';
						for (var i = 0; i < $('.sidebar-category').length; i++) {
							if ($('.sidebar-category').eq(i).attr('data-server') == pro_server.text()) {
								$('.sidebar-category').eq(i).find('.navigation').append(busyHtml);
								return;
							}
						}
						//数据请求及表格重新渲染；
						SERVER = pro_server.text();
						BUSINESS = pro_business.val();
						getServerProgressData();

					} else if (res.status == 0) {
						warningModal('错误信息', res.data);
					}

				}
			})
		}
	})

	function clearAddModal() {
		var pro_server = $('.sel_server_val'),
			pro_business = $('.pro_business'),
			pro_worker = $('.pro_worker'),
			pro_order = $('.pro_order'),
			pro_user = $('.pro_user'),
			pro_num = $('.pro_num'),
			pro_name = $('.pro_name');

		pro_server.text('请选择服务器');
		pro_business.val('');
		pro_worker.val('');
		pro_order.val('');
		pro_user.val('');
		pro_num.val('');
		pro_name.val('');
	}


	// 表格点击事件
	// 组操作
	// 组启动
	$('.datatable_progress').on('click', '.td_action_groupStart', function() {
		var group = $(this).parent().parent();
		var serverName = '';
		var workerName = group.find('.pro_group').text();
		var groupIndex = group.attr('data-group-index');
		var groupIndexNext = '';
		var table_rows = PRO_datatable.rows().data();
		for (var i = 0; i < group.siblings().length; i++) {
			if (group.siblings('.group').eq(i).attr('data-group-index') > groupIndex) {
				groupIndexNext = group.siblings('.group').eq(i).attr('data-group-index');
				break;
			} else {
				groupIndexNext = table_rows.length;
				break;
			}
		}
		if (SERVER != '') {
			serverName = SERVER;
		} else {
			nexttr = group.next();
			if (nexttr.hasClass('group')) { //当前为空组的情况；
				return;
			}
			serverName = nexttr.children("td:first-child").children("a:first-child").text();
		}
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/startProcessGroup",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					warningModal('0', '您已成功 启动 该组 进程～');

					// 不能成功渲染为接收的数据问题，测出问题：关键字搜索后再重新停止 会造成 渲染错误；
					// for (var i = Number(groupIndex); i < Number(groupIndexNext); i++) { // 状态修改
					// 	PRO_datatable.cell(i, 5).data('<span class="label label-success">running</span>').draw();
					// };

					// 因为存在某业务下无进程的情况，rows数量不可预测，造成局部渲染不可控的现象；
					// 目前 刷新来更新表格数据；
					if (SERVER == '') {
						getProgressData();
					} else {
						getServerProgressData();
					}
				}
			}
		})
	})

	// 组停止
	$('.datatable_progress').on('click', '.td_action_groupStop', function() {
		var group = $(this).parent().parent();
		var serverName = '';
		var workerName = group.find('.pro_group').text();
		var groupIndex = group.attr('data-group-index');
		var groupIndexNext = '';
		var table_rows = PRO_datatable.rows().data();
		for (var i = 0; i < group.siblings().length; i++) {
			if (group.siblings('.group').eq(i).attr('data-group-index') > groupIndex) {
				groupIndexNext = group.siblings('.group').eq(i).attr('data-group-index');
				break;
			} else {
				groupIndexNext = table_rows.length;
			}
		}
		if (SERVER != '') {
			serverName = SERVER;
		} else {
			nexttr = group.next();
			if (nexttr.hasClass('group')) { //当前为空组的情况；
				return;
			}
			serverName = nexttr.children("td:first-child").children("a:first-child").text();
		}
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/stopProcessGroup",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					warningModal('0', '您已成功 停止 该组 进程～');

					// 不能成功渲染为接收的数据问题,测出问题：关键字搜索后再重新停止 会造成 渲染错误；
					// for (var i = Number(groupIndex); i < Number(groupIndexNext); i++) { // 状态修改
					// 	PRO_datatable.cells();
					// 	PRO_datatable.cell(i, 5).data('<span class="label label-danger">stopped</span>').draw();
					// };

					// 因为存在某业务下无进程的情况，rows数量不可预测，造成局部渲染不可控的现象；
					// 目前 刷新来更新表格数据；
					if (SERVER == '') {
						getProgressData();
					} else {
						getServerProgressData();
					}

				}
			}
		})
	})

	// 组配置修改
	$('.datatable_progress').on('click', '.td_action_groupEdit', function() {
		var group = $(this).parent().parent();
		var serverName = '';
		var businessName = '';
		var workerName = group.find('.pro_group').text();
		var groupIndex = group.attr('data-group-index');
		var groupIndexNext = '';
		var table_rows = PRO_datatable.rows().data();
		var nexttr = nexttr = group.next();
		businessName = nexttr.children("td").eq(1).children("span:first-child").text();
		for (var i = 0; i < group.siblings().length; i++) {
			if (group.siblings('.group').eq(i).attr('data-group-index') > groupIndex) {
				groupIndexNext = group.siblings('.group').eq(i).attr('data-group-index');
				break;
			} else {
				groupIndexNext = table_rows.length;
			}
		}
		if (SERVER != '') {
			serverName = SERVER;
		} else {
			
			if (nexttr.hasClass('group')) { //当前为空组的情况；
				return;
			}
			serverName = nexttr.children("td:first-child").children("a:first-child").text();
		}
		// modal数据回填；
		$('#editProgressGroupModal .pro_server').val(serverName);
		$('#editProgressGroupModal .pro_business').val(businessName);
		$('#editProgressGroupModal .pro_worker').val(workerName);
		$.ajax({
			type: "post",
			url: URL_Port + "/Configure/Configure/getGroupConfig",
			data: {
				serverName: serverName,
				business: businessName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				$('#editProgressGroupModal .pro_order').val(res.command);
				$('#editProgressGroupModal .pro_user').val(res.user);
				$('#editProgressGroupModal .pro_num').val(res.numprocs);
			}
		})
	})

	//确认修改 组配置
	$('#editProgressGoup').on('click', function() {
		var serverName = $('#editProgressGroupModal .pro_server').val();
		var businessName = $('#editProgressGroupModal .pro_business').val();
		var workerName = $('#editProgressGroupModal .pro_worker').val();
		var command = $('#editProgressGroupModal .pro_order').val();
		var user = $('#editProgressGroupModal .pro_user').val();
		var group_num = $('#editProgressGroupModal .pro_num');

		if (group_num.val() == '' || !isPositiveInteger.test(group_num.val()) || group_num.val() == 0) {
			alert('进程数量 必须为大于0的正整数');
			return;
		} else {
			var numprocs = group_num.val();
			$.ajax({
				type: "post",
				url: URL_Port + "/Configure/Configure/doUpdateWorker",
				data: {
					serverName: serverName,
					business: businessName,
					workerName: workerName,
					command: command,
					user: user,
					numprocs: numprocs
				},
				dataType: 'json',
				success: function(res) {
					if (res.status == 1) {
						// 刷新表格 数据
						$('#editProgressGroupModal').modal('hide');
						if (SERVER == '') {
							getProgressData();
						} else {
							getServerProgressData();
						}
					} else {
						warningModal('错误信息', res.data);
					}
				}
			})
		}
	})
	// 组重载
	$('.datatable_progress').on('click', '.td_action_groupReload', function() {
		var targP = $(this).parent().parent().next();
		var serverName = targP.find('.td_pro_server').text();
		var workerStr = targP.find('.td_pro_progress').text();
		var indexS = targP.find('.td_pro_progress').text().indexOf(':')+1;
		var indexE = workerStr.length-3;
		var workerName = workerStr.substring(indexS , indexE);
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/reload",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					warningModal('0', '重载成功～');
				} else {
					warningModal('错误信息', res.data);
				}
			}
		})
	})

	// 组删除
	var delTarg = {};
	$('.datatable_progress').on('click', '.td_action_groupDel', function() {
		var targP = $(this).parent().parent().next();
		delTarg.serverName = targP.find('.td_pro_server').text();
		delTarg.busyName = targP.find('.td_pro_business').text();
		var workerStr = targP.find('.td_pro_progress').text();
		var indexS = targP.find('.td_pro_progress').text().indexOf(':')+1;
		var indexE = workerStr.length-3;
		delTarg.workerName = workerStr.substring(indexS , indexE);
		delTarg.index = targP.index();

		$('#deleteProgressGroupModal').modal('show');
	})
	$('#deleteProgressGoup').on('click', function() {
		$.ajax({
			type: "post",
			url: URL_Port + "/Configure/Configure/doDeleteWorker",
			data: {
				serverName: delTarg.serverName,
				business: delTarg.busyName,
				workerName: delTarg.workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					$('#deleteProgressGroupModal').modal('hide');
					CONF_datatable.row(delTarg.index).remove().draw(); // 删除当前行

					setTimeout(function() {
						warningModal('0', '删除成功');
					}, 400);
				} else {
					alert(res.data);
				}
			}
		})
	})

	// 单进程操作
	// 获取某一服务详情
	$('.datatable_progress').on('click', '.td_pro_server', function() {
		var serverName = $(this).text();
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Supervisord/serverState",
			data: {
				serverName: serverName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					$('.serverDetail_name').val(serverName);
					$('.serverDetail_apiVersion').val(res.data.apiVersion);
					$('.serverDetail_identi').val(res.data.identification);
					$('.serverDetail_state').val(res.data.state.statename);
					$('#serverDetailModal').modal('show');
				}
			}
		})
	})

	// 单个进程启动
	$('.datatable_progress').on('click', '.td_action_start', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/startProcess",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					targP.children().eq(4).html('<span class="label label-success">running</span>');
				} else {
					warningModal('错误信息', res.data);
				}
			}
		})
	})

	//单个进程停止
	$('.datatable_progress').on('click', '.td_action_stop', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/stopProcess",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					targP.children().eq(4).html('<span class="label label-danger">stopped</span>');
				} else {
					warningModal('错误信息', res.data);
				}
			}
		})
	})

	//单个进程重启
	$('.datatable_progress').on('click', '.td_action_restart', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/restartProcess",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					warningModal('0', '重启成功～');
				} else {
					warningModal('错误信息', res.data);
				}
			}
		})
	})

	//单个进程重载
	$('.datatable_progress').on('click', '.td_action_reload', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/reload",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					warningModal('0', '重载成功～');
				} else {
					warningModal('错误信息', res.data);
				}
			}
		})
	})

})