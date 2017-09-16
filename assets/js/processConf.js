$(function() {

	//全局变量；
	var URL_Port = 'http://10.99.1.155:81';
	var CONF_datatable;

	// 初始化；
	init();

	function init() {
		getProgressGroupData();
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
	 * 进程所有数据
	 */
	function getProgressGroupData() {
		var data = [];
		$.ajax({
			type: "get",
			url: URL_Port + "/Configure/Configure/workersTest",
			dataType: 'json',
			success: function(json) {
				if (json.status == 1) {
					// var serverHtml = '';
					// var configures = json.data;
					// for (var i in json.data) { 
					// 	programs.push(program);
					// }
					progressDatatable(json.data);

				} else {
					warningModal('错误提示', json.data);
				}
			}
		})
	}

	/*
	 * 所有配置列表数据展示
	 * @configures 数组，配置 数组;
	 */
	function progressDatatable(configures) {
		var rows = []; // 数据数组
		for (var i = 0; i < configures.length; i++) {
			var row = {};
			row.serverName = '<a class="td_pro_server">' + configures[i].serverName + '</a>';
			row.busyName = '<span class="td_pro_business">' + configures[i].business + '</span>';
			row.workername = '<span class="td_pro_progress">' + configures[i].workername + '</span>';
			row.command = configures[i].content.command;
			row.user = configures[i].content.user;
			row.numprocs = configures[i].content.numprocs;
			rows.push(row);
		};

		CONF_datatable = $('.dt_progress_group').DataTable({ // dataTable
			data: rows,
			destroy: true,
			columns: [{
				data: 'serverName'
			}, {
				data: 'busyName'
			}, {
				data: 'workername'
			}, {
				data: 'command'
			}, {
				data: 'user'
			}, {
				data: 'numprocs'
			}],
			columnDefs: [{
				orderable: false,
				targets: [3, 4, 5]
			}, {
				orderable: false,
				targets: [6],
				data: null,
				defaultContent: [
					'<a class="pro-action td_action_delete" href="javascript:void(0);">删除</a>'
				].join('')
			}]
		});


	}

	// 获取某一服务详情
	$('.dt_progress_group').on('click', '.td_pro_server', function() {
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

	//单个进程删除
	var delTarg = {};
	$('.dt_progress_group').on('click', '.td_action_delete', function() {
		var targP = $(this).parent().parent();
		delTarg.serverName = targP.find('.td_pro_server').text();
		delTarg.busyName = targP.find('.td_pro_business').text();
		delTarg.workerName = targP.find('.td_pro_progress').text();
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

})