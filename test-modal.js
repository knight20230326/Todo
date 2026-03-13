/**
 * Modal Functionality Test
 * 测试弹窗的打开、关闭和CSS隐藏功能
 */

const puppeteer = require('puppeteer');

async function testModal() {
  console.log('=== Modal Functionality Test ===\n');
  
  let browser;
  try {
    // Try to use puppeteer if available, otherwise use manual testing instructions
    console.log('注意: 这是一个手动测试清单\n');
    
    console.log('测试步骤:');
    console.log('1. 打开 http://localhost:3030');
    console.log('   ✓ 验证: 应该显示任务列表页面，NOT 弹窗');
    console.log('');
    
    console.log('2. 点击 "新建任务" 按钮');
    console.log('   ✓ 验证: 应该显示任务创建弹窗');
    console.log('');
    
    console.log('3. 点击弹窗顶部的 X 关闭按钮');
    console.log('   ✓ 验证: 弹窗应该立即消失');
    console.log('');
    
    console.log('4. 再次点击 "新建任务" 按钮');
    console.log('   ✓ 验证: 弹窗应该再次显示');
    console.log('');
    
    console.log('5. 点击 "取消" 按钮');
    console.log('   ✓ 验证: 弹窗应该立即消失');
    console.log('');
    
    console.log('6. 再次点击 "新建任务" 按钮');
    console.log('   ✓ 验证: 弹窗应该再次显示');
    console.log('');
    
    console.log('7. 点击弹窗外的背景区域');
    console.log('   ✓ 验证: 弹窗应该立即消失');
    console.log('');
    
    console.log('8. 再次点击 "新建任务" 按钮');
    console.log('   ✓ 验证: 弹窗应该再次显示');
    console.log('');
    
    console.log('9. 按 ESC 键');
    console.log('   ✓ 验证: 弹窗应该立即消失');
    console.log('');
    
    console.log('=== Automated CSS Verification ===\n');
    
    // Verify CSS using simple fetch
    const response = await fetch('http://localhost:3030/styles.css');
    const css = await response.text();
    
    const hasFix = css.includes('.modal[hidden]') && css.includes('display: none !important');
    
    if (hasFix) {
      console.log('✓ PASS: CSS中有.modal[hidden] { display: none !important; }');
    } else {
      console.log('✗ FAIL: CSS中缺少.modal[hidden]处理');
    }
    
    // Verify HTML initial state
    const htmlResponse = await fetch('http://localhost:3030/');
    const html = await htmlResponse.text();
    
    const hasHiddenAttr = html.includes('<div class="modal" id="modal" hidden>');
    
    if (hasHiddenAttr) {
      console.log('✓ PASS: HTML中的modal初始状态为hidden');
    } else {
      console.log('✗ FAIL: HTML中的modal没有hidden属性');
    }
    
    // Verify close button exists
    const hasCloseBtn = html.includes('id="closeModal"');
    if (hasCloseBtn) {
      console.log('✓ PASS: 关闭按钮存在');
    } else {
      console.log('✗ FAIL: 关闭按钮不存在');
    }
    
    // Verify cancel button exists
    const hasCancelBtn = html.includes('id="cancelBtn"');
    if (hasCancelBtn) {
      console.log('✓ PASS: 取消按钮存在');
    } else {
      console.log('✗ FAIL: 取消按钮不存在');
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testModal();
