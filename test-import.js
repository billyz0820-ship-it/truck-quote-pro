// 测试导入是否正确
console.log('测试导入...');

// 尝试手动创建枚举值来临时解决问题
const OrderImageEnum = {
  Created: 10,
  Pending: 20,
  Processing: 30,
  Shipped: 40,
  Delivered: 50,
  Cancelled: 60,
};

console.log('OrderImageEnum 手动创建:', OrderImageEnum);

// 如果需要，可以直接在 ExpressOrdersNew.tsx 文件顶部添加这些枚举定义
// const OrderImageEnum = {
//   Created: 10,
//   Pending: 20,
//   Processing: 30,
//   Shipped: 40,
//   Delivered: 50,
//   Cancelled: 60,
// } as const;