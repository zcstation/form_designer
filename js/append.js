$(document).ready(function () {
    /**
     * 监听select选择触发
     * @param data
     */
    const triggerOn = function (data) {
        const propertyBox = $('.xm-select-widget-select-value').parents(".propertyBox");
        const widget = propertyBox.data("widget");
        if (widget == null) {
            return;
        }
        widget.data("selectedValueData", data.arr);
        const properties = widget.data("properties");
        if (properties == null) {
            return;
        }
        const widgetType = properties['widgetType'];
        const widgetFunction = Widget[widgetType];
        if (widgetFunction == null) {
            return;
        }
        Widget.copyPropertyToWidget(propertyBox, widget);
        const select = widget.find("select").empty();
        select.append('<option value="">--请选择--</option>');

        for (let i = 0; i < data.arr.length; i++) {
            const option = $('<option></option>').text(data.arr[i].value).attr("value", data.arr[i].name);
            select.append(option);
        }
    };
    /**
     * 更新组件的值
     * @param obj
     * @param deleteFlag
     */
    const updateValue = function (obj, deleteFlag) {
        const propertyBox = $(obj).parents(".propertyBox");
        const widget = propertyBox.data("widget");
        if (widget == null) {
            return;
        }
        // 此时再删除
        if (deleteFlag) {
            $(obj).parents("tr").remove();
        }
        let arr = [];
        propertyBox.find('tr[data-id="custom"]').each(function (i, v) {
            let value = $(v).find('input').val();
            if (value) {
                arr.push({
                    name: value,
                    value: value
                });
            }
        });
        selectWidgetValue.update({data: arr});
        widget.data("selectedValueDataList", arr);
        selectWidgetValue.setValue(arr);
        triggerOn({
            arr: arr
        });
    };
    // 属性编辑框属性改变时，修改属性值
    $(document).on("change", ".add-attr", function () {
        updateValue(this);
    });
    // 添加一个选项
    $(document).on('click', "td.custom-td .add", function (e) {
        let html = '<tr data-id="custom"><td class="table-head">新增数据</td>' +
            '<td><input title="新增数据" class="u-input add-attr" name="valid_expr" value=""/></td>' +
            '<td class="custom-td"><div style="text-align: right">' +
            '<i class="iconfont add" title="下方添加选项">&#xe634;</i>' +
            '<i class="iconfont delete" title="删除选项">&#xe612;</i></div></td></tr>';
        $(this).parents("tr").after(html);
    });
    // 删除一个选项
    $(document).on('click', "td.custom-td .delete", function (e) {
        let obj = this;
        layer.confirm("确认删除该选项？", function (index) {
            updateValue(obj, true);
            layer.close(index);
        });
    });
    // 预览按钮点击
    $("#saveButton").off("click").on("click", function () {
        const propertyMap = {};
        const $reportTable = $("#reportTable");
        $reportTable.find(".widget").each(function () {
            const widget = $(this);
            const properties = widget.data("properties");
            const id = widget.attr("id");
            propertyMap[id] = properties;
        });
        // 去掉行列编辑按钮
        $reportTable.find('.col-editor').remove();
        $reportTable.find('.row-editor').remove();
        // 去掉选中的颜色
        $reportTable.find('td.light').removeClass("light");
        const reportHtml = $reportTable.prop("outerHTML");
        /*const report_id = Config['report_id'];
        const reportConfig = JSON.stringify(propertyMap);
        const parameter = {reportHtml: reportHtml, reportConfig: reportConfig, report_id: report_id};*/
        layer.open({
            type: 1,
            area: ['720px', '360px'],
            shade: 0.3,
            title: '预览',
            // 替换文本为不可编辑
            content: '<div style="padding: 10px">' + reportHtml.replace(/contenteditable="true"/g, '') + '</div>'
        });
    });
    // 选择下拉数据
    const selectWidgetValue = xmSelect.render({
        el: '.xm-select-widget-select-value',
        // 多选
        radio: false,
        // 搜索
        filterable: true,
        toolbar: {
            show: true,
        },
        data: [],
        on: function (data) {
            triggerOn(data);
        }
    });
    // 选择下拉类型
    const selectWidget = xmSelect.render({
        el: '.xm-select-widget-select',
        // 单选
        radio: true,
        // 搜索
        filterable: true,
        data: [
            {
                name: "自定义数据",
                value: "0"
            },
            {
                name: "圆织机列表",
                value: "1"
            },
            {
                name: "用户列表",
                value: "2"
            },
            {
                name: "物料列表",
                value: "3"
            }
        ],
        on: function (data) {
            // 单选选择之后关闭
            selectWidget.closed();
            const propertyBox = $('.xm-select-widget-select').parents(".propertyBox");
            const widget = propertyBox.data("widget");
            if (widget == null) {
                return;
            }
            widget.data("selectedData", data.arr);
            widget.data("selectedValueData", []);
            if (data.arr.length <= 0) {
                return;
            }
            if (data.arr[0].value === "0") {
                propertyBox.find('tr[data-id="custom"]').show();
                propertyBox.find('tr[data-id="custom-select"]').hide();
                let arr = [];
                propertyBox.find('tr[data-id="custom"]').each(function (i, v) {
                    let val = $(v).find('input').val();
                    if (val) {
                        arr.push({
                            name: val,
                            value: val
                        });
                    }
                });
                selectWidgetValue.update({data: arr});
                widget.data("selectedValueDataList", arr);
                return;
            } else {
                propertyBox.find('tr[data-id="custom"]').hide();
                propertyBox.find('tr[data-id="custom-select"]').show();
            }
            let index = layer.load();
            $.ajax({
                url: "/index/index/codeItem?code_id=" + data.arr[0].value,
                complete: function () {
                    layer.close(index);
                },
                success: function (res) {
                    // TODO res.code === 200
                    let arr = res.data.map(function (v) {
                        return {
                            name: v.key,
                            value: v.value
                        };
                    });
                    selectWidgetValue.update({
                        data: arr
                    });
                    widget.data("selectedValueDataList", arr);
                }
            });
        }
    });
    // 重写select显示方法
    Widget.select.showPropertyEditor = function (widget) {
        $(".propertyBox").hide();
        const propertyBox = $("#selectProperty").show();
        Widget.clearBoxProperties(propertyBox);
        Widget.copyPropertyToBox(propertyBox, widget);
        propertyBox.data("widget", widget);
        let arr = widget.data("selectedData") || [{name: "自定义数据", value: "0"}];
        selectWidget.setValue(arr);
        let arr1 = widget.data("selectedValueData");
        let arr2 = widget.data("selectedValueDataList") || [];
        if (arr[0].value === "0") {
            // 删除其他的配置
            propertyBox.find('tr[data-id="custom"]').remove();
            propertyBox.find('tr[data-id="custom"]').show();
            propertyBox.find('tr[data-id="custom-select"]').hide();
            let html = "";
            (arr2.length > 0 ? arr2 : [{name: "", value: ""}]).forEach(item => {
                html += '<tr data-id="custom"><td class="table-head">新增数据</td>' +
                    '<td><input title="新增数据" class="u-input add-attr" name="valid_expr" value="' + item.value + '"/></td>' +
                    '<td class="custom-td"><div style="text-align: right">' +
                    '<i class="iconfont add" title="下方添加选项">&#xe634;</i>' +
                    '<i class="iconfont delete" title="删除选项">&#xe612;</i></div></td></tr>';
            });
            propertyBox.find('tr[data-id="custom-select"]').before(html);
        } else {
            propertyBox.find('tr[data-id="custom"]').hide();
            propertyBox.find('tr[data-id="custom-select"]').show();
            // 清空值
            propertyBox.find('tr[data-id="custom"]').each(function (i, v) {
                if (i > 0) {
                    $(v).remove();
                } else {
                    $(v).find("input").val("");
                }
            });
        }
        selectWidgetValue.update({data: arr2});
        selectWidgetValue.setValue(arr1 || []);
    };
    // 右键菜单
    $("#reportTable").contextMenu('my_menu', {
        menuStyle: {
            width: "120px"
        },
        bindings: {
            'my_menu_merge_cells': function (t) {
                GridHelper.merge();
            },
            'my_menu_split_cells': function (t) {
                GridHelper.split();
            },
            "my_menu_remove": function (t) {
                layer.confirm("确定要移除改组件？", function (index) {
                    GridHelper.removeContent(t);
                    layer.close(index);
                });
            },
            "my_menu_clear": function (e) {
                layer.confirm("清空会移除该表单下的所有内容，确定要清空表单？", function (index) {
                    GridHelper.clearContent(e);
                    layer.close(index);
                });
            },
            "my_menu_text": function (e) {
                $("#widgetList").find('li[widget="text"]').trigger("click");
            },
            "my_menu_textbox": function (e) {
                $("#widgetList").find('li[widget="textbox"]').trigger("click");
            },
            "my_menu_textarea": function (e) {
                $("#widgetList").find('li[widget="textarea"]').trigger("click");
            },
            "my_menu_select": function (e) {
                $("#widgetList").find('li[widget="select"]').trigger("click");
            }
        },
        onContextMenu: function (e) {
            return e.target.tagName === "TD" || $(e.target).parents('TD').length >= 0;
        },
        onShowMenu: function (e, menu) {
            if (e.target.tagName === "TD") {
                $('#my_menu_remove', menu).remove();
            }
            return menu;
        }
    });
});