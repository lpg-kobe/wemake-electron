/**
 * @desc common component of form
 * @author pika
 */
import React from 'react';
import { Form, Col, Row } from 'antd';

type PropsType = {
  options: any;
  items?: any[];
};

function AForm(props: PropsType) {
  const { options, items } = props;
  const FormItem = Form.Item;

  return (
    <Form {...options}>
      {items &&
        items.map((item: any, num: number) =>
          item.items ?
            <Row key={num}>
              {item.items.map((ele: any, index: number, arr: []) => (
                <Col key={index} span={24 / arr.length}>
                  <FormItem {...ele.options}>{ele.component}</FormItem>
                </Col>
              ))}
            </Row> : item.component ?
              <Row key={num}>
                <Col span={24}>
                  <FormItem {...item.options}>{item.component}</FormItem>
                </Col>
              </Row>
              : null
        )
      }
    </Form>)
}
export default AForm;
