# Phase 8: Page Enhancements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance existing pages with slide-over forms, improved empty states, and role-aware table actions. Migrate modal-based forms to the new pattern.

**Depends on:** Phase 2 (SlideOver), Phase 5 (QuickAction, StepWizard, VisualSelector).

---

### Task 36: Migrate ComplaintPage to SlideOver + QuickAction

**Files:**
- Modify: `apps/web/src/pages/ComplaintPage.tsx`

**Step 1: Replace assign Modal with QuickAction popover**

Replace the `Modal` import and usage with `QuickAction` from `../components/common`. The assign action becomes an inline popover on the action dropdown instead of a separate modal.

Key changes:
- Import `QuickAction` from `../components/common`
- Remove `Modal` from antd imports
- Remove `assignModal` state and `assignForm` — replaced by inline QuickAction
- Replace the action menu "Assign" item: wrap it in a QuickAction popover with a staff Select

Replace the assign action in the dropdown with:

```tsx
{
  key: 'assign',
  icon: <UserAddOutlined />,
  label: (
    <QuickAction
      title="Assign Petugas"
      trigger={<span>Assign</span>}
      onConfirm={async () => {
        if (!selectedStaff) return;
        await api.patch(`/complaints/${record.id}/assign`, { assigneeId: selectedStaff });
        message.success('Laporan berhasil ditugaskan');
        fetchData(activeTab);
      }}
    >
      <Select
        showSearch
        optionFilterProp="label"
        placeholder="Pilih petugas..."
        style={{ width: '100%' }}
        options={staffList.map((s) => ({ label: `${s.name} (${s.role})`, value: s.id }))}
        onChange={setSelectedStaff}
      />
    </QuickAction>
  ),
}
```

Add state: `const [selectedStaff, setSelectedStaff] = useState<string>('');`

Remove the old `<Modal>` block entirely.

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintPage.tsx
git commit -m "feat(web): migrate ComplaintPage assign form to QuickAction popover"
```

---

### Task 37: Migrate TpsPage to SlideOver Form

**Files:**
- Modify: `apps/web/src/pages/TpsPage.tsx`

**Step 1: Replace Modal with SlideOver for create TPS form**

Key changes:
- Import `SlideOver` from `../components/common`
- Remove `Modal` from antd imports
- Replace `<Modal ... footer={null}>` with `<SlideOver open={modalOpen} onClose={...} title="Tambah TPS Baru" footer={...}>`
- Move submit/cancel buttons into the SlideOver `footer` prop:

```tsx
<SlideOver
  open={modalOpen}
  onClose={() => { setModalOpen(false); form.resetFields(); }}
  title="Tambah TPS Baru"
  width={520}
  footer={
    <>
      <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Batal</Button>
      <Button type="primary" onClick={() => form.submit()} loading={submitting}>Simpan</Button>
    </>
  }
>
  <Form form={form} layout="vertical" onFinish={handleCreate}>
    {/* same form fields as before, minus the inline footer buttons */}
  </Form>
</SlideOver>
```

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage.tsx
git commit -m "feat(web): migrate TpsPage form from Modal to SlideOver"
```

---

### Task 38: Migrate SchedulePage to StepWizard

**Files:**
- Modify: `apps/web/src/pages/SchedulePage.tsx`

**Step 1: Replace Modal with StepWizard for schedule creation**

The schedule form has 7+ fields (route, driver, vehicle, area, date, time, frequency) — perfect for the StepWizard pattern.

Key changes:
- Import `StepWizard` from `../components/common`
- Remove `Modal` from antd imports
- Split form fields into 3 wizard steps:
  1. "Informasi Rute" — route name, area, frequency
  2. "Driver & Kendaraan" — driver select, vehicle select
  3. "Jadwal" — date, time, notes

```tsx
<StepWizard
  open={modalOpen}
  onClose={() => { setModalOpen(false); form.resetFields(); }}
  title="Buat Jadwal Pengangkutan"
  onComplete={() => form.submit()}
  loading={submitting}
  steps={[
    {
      title: 'Informasi Rute',
      content: (
        <>
          <Form.Item name="route_name" label="Nama Rute" rules={[{ required: true }]}>
            <Input placeholder="Contoh: Rute Cimahi Utara" />
          </Form.Item>
          <Form.Item name="area_id" label="Area" rules={[{ required: true }]}>
            <Select placeholder="Pilih area" options={areas} />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Driver & Kendaraan',
      content: (
        <>
          <Form.Item name="driver_id" label="Driver" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="Pilih driver" options={drivers} />
          </Form.Item>
          <Form.Item name="vehicle_id" label="Kendaraan" rules={[{ required: true }]}>
            <Select placeholder="Pilih kendaraan" options={vehicles} />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Jadwal',
      content: (
        <>
          <Form.Item name="scheduled_date" label="Tanggal" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Catatan">
            <Input.TextArea rows={2} placeholder="Catatan tambahan (opsional)" />
          </Form.Item>
        </>
      ),
    },
  ]}
/>
```

Wrap content in `<Form form={form} layout="vertical">` outside the StepWizard, or keep the form context inside each step.

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/SchedulePage.tsx
git commit -m "feat(web): migrate SchedulePage to StepWizard multi-step form"
```

---

### Task 39: Enhance UserPage with Role VisualSelector

**Files:**
- Modify: `apps/web/src/pages/UserPage.tsx`

**Step 1: Read current UserPage and enhance create user form**

Add `VisualSelector` for role selection in the create user form. Only show relevant roles based on current user's permission level.

Key changes:
- Import `VisualSelector` from `../components/common`
- Replace the role `<Select>` with `<VisualSelector>` showing available roles as cards:

```tsx
<Form.Item name="role" label="Peran" rules={[{ required: true }]}>
  <VisualSelector
    options={[
      { value: 'dlh_admin', label: 'Admin DLH', description: 'Kelola semua operasional' },
      { value: 'tps_operator', label: 'Operator TPS', description: 'Catat sampah masuk/keluar' },
      { value: 'driver', label: 'Driver', description: 'Angkut sampah' },
      { value: 'sweeper', label: 'Penyapu', description: 'Bersihkan area' },
    ]}
    value={form.getFieldValue('role')}
    onChange={(v) => form.setFieldsValue({ role: v })}
  />
</Form.Item>
```

Also migrate the create user Modal to SlideOver if it uses one.

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/UserPage.tsx
git commit -m "feat(web): enhance UserPage with VisualSelector for role selection"
```

---

### Task 40: Update Empty States Across Pages

**Files:**
- Modify: `apps/web/src/pages/FleetPage.tsx`
- Modify: `apps/web/src/pages/PaymentPage.tsx`

**Step 1: Enhance empty states with educational content**

For each page, update the SmartTable `emptyTitle`, `emptyDescription`, and add `emptyActionLabel` + `onEmptyAction` props to provide contextual guidance.

FleetPage empty state:
```tsx
emptyTitle="Belum ada kendaraan terdaftar"
emptyDescription="Tambahkan kendaraan untuk mulai mengatur jadwal pengangkutan. Anda bisa menambahkan truk, gerobak, atau motor."
emptyActionLabel="Tambah Kendaraan"
onEmptyAction={() => setModalOpen(true)}
```

PaymentPage empty state:
```tsx
emptyTitle="Belum ada data retribusi"
emptyDescription="Data retribusi akan muncul setelah pembayaran pertama tercatat di sistem."
```

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/FleetPage.tsx apps/web/src/pages/PaymentPage.tsx
git commit -m "feat(web): enhance empty states with educational content across pages"
```
