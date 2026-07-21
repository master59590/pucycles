export default function AdminSettingsPage() {
  return (
    <main>
      <div className="admin-page-heading"><div><span>การตั้งค่า</span><h1>ตั้งค่าร้านค้า</h1><p>ข้อมูลที่ใช้ในการสั่งซื้อและคำสั่งซื้อระหว่างประเทศ</p></div></div>
      <section className="admin-settings-grid">
        <div><h2>ข้อมูลร้านค้า</h2><label>ชื่อร้าน<input defaultValue="PUCYCLES" /></label><label>อีเมลติดต่อ<input type="email" defaultValue="masterbean9@gmail.com" /></label></div>
        <div><h2>ค่าเริ่มต้นคำสั่งซื้อ</h2><label>สกุลเงินหลัก<select defaultValue="THB"><option>THB</option></select></label><label>การจองสต็อก<select defaultValue="checkout"><option value="checkout">เมื่อสร้างคำสั่งซื้อ</option></select></label></div>
      </section>
    </main>
  );
}
