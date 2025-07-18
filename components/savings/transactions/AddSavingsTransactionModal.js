import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Tag,
} from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";

export default function AddSavingsTransactionModal({
  visible,
  onClose,
  onSuccess,
  savingsId,
  savingsAccount,
  editingTransaction,
}) {
  const [form] = Form.useForm();
  const isEditing = !!editingTransaction;

  const handleFinish = async (values) => {
    try {
      let payload = {
        ...values,
        savingsId,
        date: values.date.toISOString(),
      };
      if (isEditing) {
        payload = {
          ...payload,
          _id: editingTransaction._id,
        };
      }

      const url = isEditing
        ? `/api/savings/saving-transaction`
        : "/api/savings/saving-transaction";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save transaction");

      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (visible) {
      if (editingTransaction) {
        console.log("edit ", editingTransaction);
        form.setFieldsValue({
          date: dayjs(editingTransaction.date),
          type: editingTransaction.type,
          amount: editingTransaction.amount,
          description: editingTransaction.description,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          type: "deposit",
        });
      }
    }
  }, [visible, editingTransaction]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={isEditing ? "Edit Transaction" : "Add Savings Transaction"}
      footer={null}
      centered
    >
      {savingsAccount && (
        <div className="mb-4 border rounded p-4">
          <div className="text-lg font-semibold uppercase">
            {savingsAccount.accountName}
          </div>
          <div className="text-sm text-gray-500">
            {savingsAccount.savingsType}
          </div>
          <div className="flex gap-6 mt-2 text-sm">
            <div>
              <span className="text-gray-500">Initial Balance: </span>
              <span className="font-medium text-blue-600">
                ₹{savingsAccount.amount?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Current Balance: </span>
              <span className="font-medium text-green-600">
                ₹{savingsAccount.runningBalance?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ type: "deposit" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="date"
            label="Transaction Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" format="DD-MM-YYYY" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Transaction Type"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="deposit">
                <Tag color="green">Deposit</Tag>
              </Select.Option>
              <Select.Option value="interest">
                <Tag color="blue">Interest</Tag>
              </Select.Option>
              <Select.Option value="withdrawal">
                <Tag color="red">Withdrawal</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (INR)"
            rules={[{ required: true, type: "number", min: 0.01 }]}
            className="md:col-span-1"
          >
            <InputNumber style={{ width: "100%" }} prefix="₹" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Remarks"
            className="md:col-span-1"
          >
            <Input />
          </Form.Item>
        </div>

        <Form.Item>
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {isEditing ? "Update Transaction" : "Add Transaction"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
