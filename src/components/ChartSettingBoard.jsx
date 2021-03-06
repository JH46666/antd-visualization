import React, { Component } from 'react';
import { Row, Col, Select, Icon, Input, Menu } from 'antd'
import { StarTwoTone  }  from '@ant-design/icons';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DropConfigChart from './DropConfigChart';
import WorkSheetConfig from './WorkSheetConfig';
import store from '../redux/store';

import "antd/dist/antd.css";

import DropElement from './DropElement';
import update from 'immutability-helper';
import echartConfig from './echartConfig';
import './chartSettingBoard.css';
import axios from '../axios/index';
import { FILED_TYPE } from '../enums/index';
import ConfigDropBox from './ConfigDropBox';
import DragElement from './DragElement';

const Option = Select.Option;
const dragItem = 'item';
const colorSet = ['#9CC5B0', '#C9856B', '#6F9FA7', '#334553', '#B34038', '#7D9D85', '#C1883A']
const { Search } = Input
const { SubMenu } = Menu;

const lineData = [
    { name: '年销量', type: 'string', value: 'year', id: 0, data: ['2013', '2014', '2015', '2016', '2017', '2018'], color: '#9CC5B0', chart: 'line' },
    { name: '华北', type: 'value', value: 'h', id: 1, data: [40, 80, 20, 120, 140, 50], color: '#C9856B', chart: 'line' },
    { name: '华东', type: 'value', value: 'h', id: 2, data: [140, 180, 120, 40, 50, 150], color: '#6F9FA7', chart: 'line' },
    { name: '华南', type: 'value', value: 'n', id: 3, data: [110, 143, 68, 90, 120, 130], color: '#334553', chart: 'line' }
];
const pieData = [
    { value: 335, name: '京东', type: 'value', id: 0, color: '#9CC5B0' },
    { value: 310, name: '菜鸟', type: 'value', id: 1, color: '#C9856B' },
    { value: 234, name: '总部', type: 'value', id: 2, color: '#6F9FA7' },
    { value: 135, name: '小电商', type: 'value', id: 3, color: '#334553' },
    { value: 1548, name: '大电商', type: 'value', id: 4, color: '#B34038' }
]
const chartType = [
    { value: 'line', name: '折线图' },
    { value: 'bar', name: '柱状图' },
    { value: 'pie', name: '饼图' }
]

export class ChartSettingBoard extends Component {

    constructor(props) {
        super(props);
        this.dragEleMove = this.dragEleMove.bind(this);
        this.beginDrag = this.beginDrag.bind(this)
        this.canDrop = this.canDrop.bind(this)
        this.endDrag = this.endDrag.bind(this)
        this.delItem = this.delItem.bind(this)
        this.changeItem = this.changeItem.bind(this)
        this.onSelectChartType = this.onSelectChartType.bind(this);
        // 获取store中state数据要通过store.getState()方法
        // console.log('store', store.getState()) 
        // store.subscribe(this.storeChange) // 订阅Redux的状态
        this.state = {
          project_id: props.project_id,
          data_id: props.data_id,
          activeId: '',
          activeDropId: '',
          itemList: lineData,
          chartType: 'line',
          dropConfig: echartConfig['line']
      }
    }

    shouldComponentUpdate(nextProps, nextState){
      console.log('nextProps, nextState: ', nextProps, nextState);
      const { props, state } = this;
      function shallowCompare(a,b){
        return a===b || Object.keys(a).every(k => a[k] === b[k])
      }
      return shallowCompare(nextProps, props) && shallowCompare(nextState, state)
    }

    params = {
      page: 1
    }
    dragEleMove(id) {
        this.setState({ activeDropId: id })
    }

    beginDrag(id) {
        this.setState({ activeId: id })
    }

    canDrop(id) {
        const { itemList, activeId, dropConfig } = this.state;
        if (itemList[activeId].type !== dropConfig[id].type) {
            return false;
        }
        return true
    }

    endDrag() {
        const { itemList, activeId, dropConfig, activeDropId } = this.state;
        const ilist = update(itemList, { $splice: [[activeId, 1]] })
        const dlist = update(dropConfig, { [activeDropId]: { items: { $push: [itemList[activeId]] } } })
        this.setState({ itemList: ilist, dropConfig: dlist })
    }

    delItem(item, pitem, pid) {
        const { itemList, dropConfig } = this.state;
        for (let i = 0; i < pitem.items.length; i++) {
            if (pitem.items[i].id === item.id) {
                pitem.items.splice(i, 1);
                break;
            }
        }
        const nlist = update(itemList, { $push: [item] })
        const dropList = update(dropConfig, { [pid]: { $set: pitem } })
        this.setState({ itemList: nlist, dropConfig: dropList })
    }

    onSelectChartType(type) {
        if (type === 'pie') {
            this.setState({ itemList: pieData, dropConfig: echartConfig[type], chartType: type })
        } else {
            const nlist = [...lineData];
            for (let i = 0; i < nlist.length; i++) {
                nlist[i].chart = type;
            }
            this.setState({ itemList: nlist, dropConfig: echartConfig[type], chartType: type })
        }
    }

    changeItem(value, key, id, pid) {
        const { dropConfig } = this.state;
        const nitem = { ...dropConfig[pid].items[id] }
        nitem[key] = value;
        const dropList = update(dropConfig, { [pid]: { items: { [id]: { $set: nitem } } } })
        this.setState({ dropConfig: dropList })
    }


    componentDidMount(){
    
    }

    componentWillReceiveProps(nextProps){
      nextProps.data_id && this.request(nextProps.project_id, nextProps.data_id);
    }
    request = (project_id, data_id)=>{
        axios.ajax({
          url:`/dta/dataFile/fields/${data_id}`,
        }).then((res)=>{
          console.log('res: ', res.data_fields);
          let itemList = res.data_fields
          this.setState({
            itemList
          })
        }).catch((err)=>{
          console.log('err: ', err);

        })

        axios.ajax({
          url: '/vis/worksheet',
          method: 'post',
          data:{
            project_id,
            worksheet_nm: '工作表1',
            data_id
          }
        }).then((res)=>{
          console.log('res: ', res);

        }).catch((err)=>{
          console.log('err: ', err);

        })      
    }


    btnHandle = () => {
  /*     manager.actions.push({c
        name: 'changePosition',
        params: { target: 'left', value: 10 }
      });

      const execFn = manager.getFunction(action.name);mg
      manager.data = execFn(manager.data, action.params);

      if (manager.undoActions.length) {
          manager.undoActions = [];
      } */
    }

/*     undo = () => {
      const action = manager.actions.pop();
      const undoFn = manager.getFunction(`${action.name}Undo`);
      manager.data = undoFn(manager.data, action.params);
      manager.undoActions.push(action);

    }


    redo = () => {
        const action = manager.undoActions.pop();
        const execFn = manager.getFunction(action.name);
        manager.data = execFn(manager.data, action.params);
    }
 */
    render() {
        const { itemList, dropConfig } = this.state
        console.log('itemList: ', itemList);
        const leftItems = itemList.map((item, idx) => {
            return (
                <div key={idx}>
                    <DragElement item={item} beginDrag={this.beginDrag} id={idx} endDrag={this.endDrag} />
                </div>
            )
        })
        
        const dropList = dropConfig.map((item, idx) => {
            const items = item.items.map((sitem, sid) => {
                return (
                    <div key={sid}>
                        <DropElement item={sitem} pitem={item} pid={idx} delItem={this.delItem} changeItem={(value, key) => this.changeItem(value, key, sid, idx)} />
                    </div>
                )
            })

            return (
                <Row  key={idx} style={{width: ' 100%'}} >
                  <Col span={24} >
                  <ConfigDropBox move={this.dragEleMove} item={item} id={idx} canDrop={this.canDrop}>
                        {items}
                    </ConfigDropBox>
                  </Col>
                </Row>
            )
        })
        
        return (
            <div className='chartSettingBoard'>
                <div>
                  <h3>可视化</h3>
                  <div onClick={this.btnHandle}></div> 
                </div>

                <Row gutter={10}>
                    <Col sm={4}>
                        <div style={{ height: '50px', width: '100%' }}>
                        <Search
                          placeholder="input search text"
                          onSearch={value => console.log(value)}
                          style={{ width: 200 }}
                          enterButton
                        />
                        </div>
                        <div className='leftBox'>
                            {leftItems}
                        </div>
                        <WorkSheetConfig project_id={this.props.project_id}/>                
                    </Col>
                    <Col sm={18}>
                        <Row gutter={10}>
                            {dropList}
                        </Row>
                        <DropConfigChart dropConfig={this.state.dropConfig} chartType={this.state.chartType} />
                    </Col>
                </Row>
            </div>
        )
    }
}


export default DragDropContext(HTML5Backend)(ChartSettingBoard);