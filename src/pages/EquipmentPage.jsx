import React, { useState, useEffect } from "react";
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
  Select, // Añadido para el filtro de disponibilidad
  Tag, // Para mostrar etiquetas de disponibilidad
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  BarcodeOutlined,
  EyeOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  ToolOutlined,
  FilterOutlined, // Añadido para el icono de filtro
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const { Option } = Select; // Añadido para las opciones del selector

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // Nuevo estado para el filtro de disponibilidad
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    // Aplicar filtros (búsqueda de texto + disponibilidad)
    const lowerSearchText = searchText.toLowerCase();
    
    setFilteredEquipment(
      equipment.filter(
        (item) => {
          // Filtro de texto
          const matchesText = 
            item.name?.toLowerCase().includes(lowerSearchText) ||
            item.equipment_number?.toLowerCase().includes(lowerSearchText);
          
          // Filtro de disponibilidad
          let matchesAvailability = true;
          if (availabilityFilter === "available") {
            matchesAvailability = item.available_stock > 0;
          } else if (availabilityFilter === "unavailable") {
            matchesAvailability = item.available_stock <= 0;
          }
          
          return matchesText && matchesAvailability;
        }
      )
    );
  }, [equipment, searchText, availabilityFilter]); // Añadido availabilityFilter como dependencia

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getEquipment();
      setEquipment(data);
    } catch (error) {
      message.error(`Error al cargar equipamientos: ${error.message}`);
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
      message.success("Equipamiento añadido correctamente");
      setIsModalVisible(false);
      fetchEquipment(); // Recargar lista
    } catch (error) {
      console.error("Error adding equipment:", error);
      if (error.message && error.message.includes("UNIQUE constraint failed")) {
        message.error("Error: El número de equipamiento introducido ya existe.");
      } else {
        message.error(`Error al añadir equipamiento: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    setLoading(true);
    try {
      await window.electronAPI.deleteEquipment(equipmentId);
      message.success("Equipamiento eliminado correctamente");
      fetchEquipment();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      message.error(`Error al eliminar equipamiento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Acciones",
      key: "action",
      width: 100,
      align: "center",
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
              title="¿Estás seguro de eliminar este equipamiento?"
              description="Se eliminarán todas sus ayudas técnicas asociadas."
              onConfirm={() => handleDeleteEquipment(record.id)}
              okText="Sí"
              cancelText="No"
            >
              <Button danger shape="circle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Nº Equipamiento",
      dataIndex: "equipment_number",
      key: "equipment_number",
      sorter: (a, b) => a.equipment_number.localeCompare(b.equipment_number),
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Link to={`/equipment/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: "Stock Inicial",
      dataIndex: "initial_stock",
      key: "initial_stock",
      sorter: (a, b) => a.initial_stock - b.initial_stock,
      align: "right",
    },
    {
      title: "Prestado",
      dataIndex: "lended_stock",
      key: "lended_stock",
      sorter: (a, b) => a.lended_stock - b.lended_stock,
      align: "right",
    },
    {
      title: "Disponible",
      dataIndex: "available_stock",
      key: "available_stock",
      sorter: (a, b) => a.available_stock - b.available_stock,
      align: "right",
      render: (stock) => (
        <Tag color={stock > 0 ? 'green' : 'red'}>
          {stock > 0 ? stock : 'Sin stock'}
        </Tag>
      )
    },
  ];

  return (
    <div>
      <Space
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Input
            placeholder="Buscar equipamiento (Nombre, Nº Equipamiento)"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            value={availabilityFilter}
            onChange={setAvailabilityFilter}
            style={{ width: 180 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">Todos los equipamientos</Option>
            <Option value="available">Con disponibilidad</Option>
            <Option value="unavailable">Sin disponibilidad</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          Añadir Equipamiento
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredEquipment}
        showSorterTooltip={false}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
        size="small"
      />

      {/* Modal para añadir equipamiento */}
      <Modal
        title="Añadir Nuevo Equipamiento"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddEquipment}>
          <Form.Item
            name="equipment_number"
            label="Número de Equipamiento"
            rules={[
              {
                required: true,
                message: "Por favor, introduce el número de equipamiento",
              },
            ]}
          >
            <Input
              prefix={<BarcodeOutlined />}
              placeholder="Identificador único del equipamiento"
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Nombre del Equipamiento"
            rules={[
              {
                required: true,
                message: "Por favor, introduce el nombre del equipamiento",
              },
            ]}
          >
            <Input prefix={<ToolOutlined />} placeholder="Nombre del equipamiento" />
          </Form.Item>
          <Form.Item
            name="initial_stock"
            label="Stock Inicial"
            tooltip="Cantidad inicial de este tipo de equipamiento disponible."
            rules={[
              {
                required: true,
                message: "Por favor, introduce el stock inicial (mínimo 1)",
              },
            ]}
            initialValue={1} // Valor por defecto
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              prefix={<DatabaseOutlined />}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Añadir Equipamiento
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentPage;
