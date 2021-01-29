/* eslint no-unused-expressions: [0, { allowShortCircuit: true }] */

/**
 * @desc common component if table
 * @author pika
 */
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { Table, Col, Row, Form, List } from 'antd';
import { connect } from 'dva';

type PropsType = {
  rowKey?: any;
  searchForm?: any;
  showIndex?: boolean;
  columns: Array<any>;
  dataSource?: Array<any>;
  pagination?: any;
  tableId?: string;
  url?: string;
  tableList?: boolean;
  dispatch: any;
  system: any;
  children: any;
};

function ATable(props: PropsType) {
  const {
    // 指定rowKey,domDiff用到
    // @ts-ignore
    rowKey = rowKey ||
    function (row: any) {
      return row.id;
    },
    // 是否配置搜索菜单
    searchForm,
    // 是否显示序号
    showIndex,
    // 表头配置
    columns,
    // 数据源
    // @ts-ignore
    dataSource = dataSource || [],
    // 分页配置
    // @ts-ignore
    pagination = pagination || {},
    // 自动处理分页时要更新的唯一tableId,多个表格处理分页时用到
    // @ts-ignore
    tableId = tableId || '',
    // 自动获取数据的api_url
    // @ts-ignore
    url = url || '',
    // 是否为卡片式表格
    tableList,
    dispatch,
    system: { table, updateTableId },
  } = props;
  const isAutoFetch = url && tableId;
  const curTable = table[tableId] || {};
  const tableData = curTable.data || [];
  const tablePagination = curTable.pagination || {};
  const defaultPagination = {
    hideOnSinglePage: true,
    // position: ['bottomCenter'],
    current: 1,
    pageSize: 10,
    total: 0,
    // pageSizeOptions: ['10', '20', '30', '50', '100'],
    showQuickJumper: false,
    // showSizeChanger: true,
    showTotal: (total: any) => {
      return `共 ${Math.ceil(total / defaultPagination.pageSize)} 页`;
    },
  };

  const [newColumns, setColumns] = useState(columns);
  const [newDataSources, setDataSources] = useState(dataSource);
  const [newPagination, setPagination] = useState(defaultPagination);

  useLayoutEffect(() => {
    if (isAutoFetch) {
      // init data once when set
      getList();
    }
  }, []);

  useEffect(
    () => {
      if (isAutoFetch) {
        // auto fetch data from self when set url&tableId prop
        const {
          // @ts-ignore
          current = current || 1,
          // @ts-ignore
          pageSize = pageSize || 10,
        } = tablePagination;
        setPagination({
          ...defaultPagination,
          ...tablePagination,
          onChange: (page: number, pageSize: number) =>
            getList({ page, pageSize }),
        });
        setDataSources(
          tableData.map((item: any, index: number) => ({
            ...item,
            index: pageSize * (current - 1) + index + 1,
          }))
        );
      } else {
        // without setting url&tableId will controll by route component
        const {
          // @ts-ignore
          current = current || 1,
          // @ts-ignore
          pageSize = pageSize || 10,
        } = pagination;
        setPagination({ ...defaultPagination, ...pagination });
        setDataSources(
          dataSource.map((item: any, index: number) => ({
            ...item,
            index: pageSize * (current - 1) + index + 1,
          }))
        );
      }
      if (showIndex) {
        newColumns.unshift({
          title: '序号',
          dataIndex: 'index',
          key: 'index',
        });
        setColumns(newColumns);
      }
    },
    isAutoFetch ? [updateTableId] : [dataSource]
  );

  function getList(params = {}) {
    dispatch({
      type: 'system/getTableData',
      payload: {
        url,
        tableId,
        ...params,
      },
    });
  }

  /**
   * @desc custom render each col of searchForm,like =>
   * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * ++ component ++  form  ++  [search btn][ clear btn]  +++
   * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * @param {Object} item each item col of searchForm
   */
  function renderComponent(item: any) {
    const {
      options: { extra },
    } = item;
    // render form ?
    if (extra && extra.form) {
      const { items, options } = extra.form;
      const FormItem = Form.Item;
      return (
        <Form {...options} className="ant-row table-search-form">
          {items.map((ele: any, index: number) => (
            <Col key={index} span={24 / items.length} {...ele.options.colOpts}>
              <FormItem {...ele.options}>{ele.component}</FormItem>
            </Col>
          ))}
        </Form>
      );
    }
    // render btn ?
    if (extra && extra.btns) {
      const { items } = extra.btns;
      return (
        <div className="table-operate-btns">
          {items.map((btn: any) => btn.component)}
        </div>
      );
    }
    // render custom component?
    return item.component;
  }

  /**
   * @desc filter iligal react props,which can cause error on development
   * @param {Object} props props attribute of component
   */
  function filterProps(filterKeys: Array<string>, props: PropsType) {
    const filterObj = Object.create(null)
    Object.entries(props).forEach(([key, value]) => {
      !filterKeys.includes(key) && (filterObj[key] = value)
    })
    return filterObj
  }

  return (
    <section>
      {searchForm && (
        <div className="table-search-box">
          <Row>
            {searchForm.items &&
              searchForm.items.map((item: any, index: number) => (
                <Col
                  key={index}
                  span={24 / searchForm.items.length}
                  {...item.options.colOpts}
                >
                  {renderComponent(item)}
                </Col>
              ))}
          </Row>
        </div>
      )
      }
      { props.children}
      {
        tableList ? (
          <List
            grid={{ gutter: 16, column: 4 }}
            {...filterProps(['tableList', 'searchForm', 'dispatch', 'system'], props)}
            pagination={newPagination}
          />
        ) : (
            <Table
              {...filterProps(['tableList', 'searchForm', 'dispatch', 'system'], props)}
              columns={newColumns}
              dataSource={newDataSources}
              pagination={newPagination}
            />
          )
      }
    </section >
  );
}
export default connect(({ system }: any) => ({
  system: system.toJS(),
}))(ATable);
