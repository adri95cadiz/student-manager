import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber, // Para el stock inicial
  message,
  Space,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  BarcodeOutlined,
  EyeOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    const lowerSearchText = searchText.toLowerCase();
    setFilteredEquipment(
      equipment.filter(item =>
        item.name.toLowerCase().includes(lowerSearchText) ||
        item.equipment_number.toLowerCase().includes(lowerSearchText)
      )
    );
  }, [equipment, searchText]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getEquipment();
      setEquipment(data);
    } catch (error) {
      message.error(`Error al cargar equipos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleAddEquipment = async (values) => {
    setLoading(true);
    try {
      await window.electronAPI.addEquipment(values);
      message.success('Equipo añadido correctamente');
      setIsModalVisible(false);
      fetchEquipment(); // Recargar lista
    } catch (error) {
      console.error('Error adding equipment:', error);
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
          message.error('Error: El número de equipo introducido ya existe.');
      } else {
        message.error(`Error al añadir equipo: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    setLoading(true);
    try {
      await window.electronAPI.deleteEquipment(equipmentId);
      message.success('Equipo eliminado correctamente');
      fetchEquipment();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      message.error(`Error al eliminar equipo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Acciones',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Detalles">
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/equipment/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Popconfirm
               title="¿Seguro que quieres eliminar este equipo? Se eliminarán también sus préstamos asociados."
               onConfirm={() => handleDeleteEquipment(record.id)}
               okText="Sí"
               cancelText="No"
            >
              <Button
                danger
                shape="circle"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Nº Equipo',
      dataIndex: 'equipment_number',
      key: 'equipment_number',
      sorter: (a, b) => a.equipment_number.localeCompare(b.equipment_number),
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => <Link to={`/equipment/${record.id}`}>{text}</Link>,
    },
    {
        title: 'Stock Inicial',
        dataIndex: 'initial_stock',
        key: 'initial_stock',
        sorter: (a, b) => a.initial_stock - b.initial_stock,
        align: 'right',
    },
    {
        title: 'Prestado',
        dataIndex: 'lended_stock',
        key: 'lended_stock',
        sorter: (a, b) => a.lended_stock - b.lended_stock,
        align: 'right',
    },
    {
        title: 'Disponible',
        dataIndex: 'available_stock',
        key: 'available_stock',
        sorter: (a, b) => a.available_stock - b.available_stock,
        align: 'right',
    },

  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input
          placeholder="Buscar equipo (Nombre, Nº Equipo)"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          Añadir Equipo
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredEquipment}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
        size="small"
      />

      {/* Modal para añadir equipo */}
      <Modal
        title="Añadir Nuevo Equipo"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEquipment}
          requiredMark={false}
        >
          <Form.Item
            name="equipment_number"
            label="Número de Equipo"
            rules={[{ required: true, message: 'Por favor, introduce el número de equipo' }]}
          >
            <Input prefix={<BarcodeOutlined />} placeholder="Identificador único del equipo" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Nombre del Equipo"
            rules={[{ required: true, message: 'Por favor, introduce el nombre del equipo' }]}
          >
            <Input prefix={<ToolOutlined />} placeholder="Nombre del equipo" />
          </Form.Item>
          <Form.Item
            name="initial_stock"
            label="Stock Inicial"
            tooltip="Cantidad inicial de este tipo de equipo disponible."
            rules={[{ required: true, message: 'Por favor, introduce el stock inicial (mínimo 1)'}]}
            initialValue={1} // Valor por defecto
          >
            <InputNumber min={1} style={{ width: '100%' }} prefix={<DatabaseOutlined />} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Añadir Equipo
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentPage; 