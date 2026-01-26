import { db } from "../db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface TrackingEvent {
  status: string;
  description: string;
  location: string;
  timestamp: string;
  icon?: string;
}

const LOGISTICS_FLOW = [
  { status: 'picked_up', desc: '包裹已由物流公司揽收', location: '发货地仓库' },
  { status: 'departed_origin', desc: '包裹已离开始发地仓库', location: '国际物流中心' },
  { status: 'arrived_customs', desc: '包裹到达出口口岸，正在办理通关手续', location: '海关监管区' },
  { status: 'cleared_customs', desc: '海关放行，等待航班安排', location: '国际机场' },
  { status: 'departed_country', desc: '航班已起飞，飞往目的国', location: '空中' },
  { status: 'arrived_destination', desc: '航班抵达目的国机场', location: '目的国机场' },
  { status: 'import_clearance', desc: '进口清关完成，转交国内派送', location: '目的国海关' },
  { status: 'out_for_delivery', desc: '包裹正在派送中，请保持电话畅通', location: '目的城市配送站' },
  { status: 'delivered', desc: '包裹已签收，感谢使用', location: '收货地址' },
];

export async function getTracking(orderId: number): Promise<TrackingEvent[]> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order || !order.shippedAt) {
    return [];
  }

  const trackingEvents: TrackingEvent[] = [];
  const shippedTime = new Date(order.shippedAt).getTime();
  const now = Date.now();
  
  // 基础时间：发货时间
  // 模拟时间流逝：假设整个流程需要 7 天 (168小时)
  // 为了演示效果，如果发货时间在很久以前，就显示全部；如果是刚刚发货，显示一部分
  
  // 总是添加第一条：已揽收
  trackingEvents.push({
    status: 'picked_up',
    description: `物流公司已揽收 (${order.logisticsCompany || '未知物流'})`,
    location: '发货地仓库',
    timestamp: new Date(shippedTime).toISOString(),
    icon: 'package'
  });

  // 根据时间推算后续状态
  // 假设每 12 小时更新一个状态
  const hoursSinceShipped = (now - shippedTime) / (1000 * 60 * 60);
  
  for (let i = 1; i < LOGISTICS_FLOW.length; i++) {
    const step = LOGISTICS_FLOW[i];
    // 每一个步骤需要 4-8 小时的间隔
    const stepDelayHours = i * 6; 
    
    if (hoursSinceShipped >= stepDelayHours) {
      // 模拟这个状态的时间点
      const eventTime = new Date(shippedTime + stepDelayHours * 60 * 60 * 1000);
      
      // 如果是最后一个状态（已签收），检查订单是否真的是 completed
      if (step.status === 'delivered') {
        if (order.status === 'completed' || order.status === 'delivered') {
            trackingEvents.push({
                status: step.status,
                description: step.desc,
                location: step.location,
                timestamp: order.completedAt ? new Date(order.completedAt).toISOString() : eventTime.toISOString(),
                icon: 'check'
            });
        }
      } else {
        trackingEvents.push({
            status: step.status,
            description: step.desc,
            location: step.location,
            timestamp: eventTime.toISOString(),
            icon: 'truck'
        });
      }
    }
  }

  // 按时间倒序
  return trackingEvents.reverse();
}
