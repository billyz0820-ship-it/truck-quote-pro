// 测试邮编分区模板API调用
const { zipZoneTemplateApi } = require('./src/utils/api.js');

async function testZipZoneTemplateAPI() {
  console.log('=== 测试邮编分区模板API ===');
  
  try {
    // 测试获取模板列表
    console.log('测试1: 获取模板列表');
    const response = await zipZoneTemplateApi.getTemplateList({
      pageIndex: 1,
      pageSize: 10,
      name: [],
      customerId: ''
    });
    
    console.log('API调用成功:', response);
    
    // 测试带筛选条件的请求
    console.log('\n测试2: 带筛选条件的请求');
    const filteredResponse = await zipZoneTemplateApi.getTemplateList({
      pageIndex: 1,
      pageSize: 20,
      name: ['模板1', '模板2'],
      customerId: 'customer1',
      sortField: 'name',
      sortValue: true
    });
    
    console.log('带筛选条件的API调用成功:', filteredResponse);
    
  } catch (error) {
    console.error('API调用失败:', error);
  }
}

// 导出测试函数
module.exports = { testZipZoneTemplateAPI };

// 如果直接运行此文件
if (require.main === module) {
  testZipZoneTemplateAPI();
}