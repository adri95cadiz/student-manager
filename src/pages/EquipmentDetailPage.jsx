import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Typography, Descriptions, Table, Tag, Button, 
  Space, message, Divider, Statistic, Row, Col,
  Skeleton, Popconfirm, Tooltip, Empty, Progress,
  Modal, Form, Input, InputNumber
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  ToolOutlined,
  AuditOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EquipmentDetailPage = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchEquipmentDetail = async () => {
      setLoading(true);
      try {
        const data = await window.electronAPI.getEquipmentDetail(parseInt(equipmentId));
        setEquipment(data);
      } catch (err) {
        console.error('Error fetching equipment details:', err);
        setError('No se pudo cargar la información del equipo.');
        message.error('Error al cargar los detalles del equipo.');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentDetail();
  }, [equipmentId]);

  const handleReturnAid = async (aidId) => {
    try {
      await window.electronAPI.returnTechnicalAid({ aidId });
      message.success('Ayuda técnica marcada como devuelta');
      // Recargar los datos del equipo
      const data = await window.electronAPI.getEquipmentDetail(parseInt(equipmentId));
      setEquipment(data);
    } catch (error) {
      console.error("Error returning aid:", error);
      message.error(`Error al devolver ayuda técnica: ${error.message}`);
    }
  };

  const handleDeleteEquipment = async () => {
    try {
      await window.electronAPI.deleteEquipment(parseInt(equipmentId));
      message.success('Equipo eliminado correctamente');
      navigate('/equipment');
    } catch (error) {
      console.error("Error deleting equipment:", error);
      message.error(`Error al eliminar equipo: ${error.message}`);
    }
  };

  const showEditModal = () => {
    form.setFieldsValue({
      name: equipment.name,
      equipment_number: equipment.equipment_number,
      initial_stock: equipment.initial_stock
    });
    setIsEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
  };

  const handleEditSubmit = async (values) => {
    try {
      await window.electronAPI.updateEquipment({
        id: parseInt(equipmentId),
        ...values
      });
      message.success("Equipo actualizado correctamente");
      setIsEditModalVisible(false);
      // Recargar los datos del equipo
      const data = await window.electronAPI.getEquipmentDetail(parseInt(equipmentId));
      setEquipment(data);
    } catch (error) {
      console.error("Error updating equipment:", error);
      message.error(`Error al actualizar equipo: ${error.message}`);
    }
  };

  // Columnas para la tabla de ayudas técnicas
  const lendingsColumns = [
    {
      title: 'Estado',
      dataIndex: 'return_date',
      key: 'status',
      width: 100,
      align: 'center',
      render: (return_date) => (
        return_date
          ? <Tag color="green">Devuelto</Tag>
          : <Tag color="orange">Pendiente</Tag>
      ),
    },
    {
      title: 'Estudiante',
      key: 'student',
      render: (_, record) => (
        <a onClick={() => navigate(`/students/${record.student_id}`)}>
          {`${record.student_name} ${record.student_surname}`}
        </a>
      ),
    },
    {
      title: 'Nº Estudiante',
      dataIndex: 'student_number',
      key: 'student_number',
      width: 120,
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      align: 'right',
    },
    {
      title: 'Fecha Adquisición',
      dataIndex: 'lending_date',
      key: 'lending_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Fecha Devolución',
      dataIndex: 'return_date',
      key: 'return_date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Curso Escolar',
      dataIndex: 'school_year',
      key: 'school_year',
      width: 120,
    },
    {
      title: 'Acciones',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        !record.return_date ? (
          <Tooltip title="Marcar como Devuelto">
            <Popconfirm
              title="¿Marcar esta ayuda como devuelta?"
              onConfirm={() => handleReturnAid(record.id)}
              okText="Sí"
              cancelText="No"
            >
              <Button
                type="primary"
                shape="circle"
                icon={<SwapOutlined />}
                size="small"
                ghost
              />
            </Popconfirm>
          </Tooltip>
        ) : null
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div style={{ padding: 24 }}>
        <Empty 
          description={error || "No se encontró información del equipo"} 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/equipment')}>
            Volver a Equipos
          </Button>
        </div>
      </div>
    );
  }

  // Calcular ayudas técnicas activas y stock disponible
  const activeLendings = equipment.lendings.filter(lending => !lending.return_date);
  const lendedDevices = activeLendings.reduce((sum, lending) => sum + lending.quantity, 0);
  const stockPercentage = (equipment.available_stock / equipment.initial_stock) * 100;

  return (
    <div style={{ padding: 24 }}>
      {/* Cabecera con botones de acción */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/equipment')}>
            Volver
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            <ToolOutlined /> {equipment.name}
          </Title>
        </Space>
        
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={showEditModal}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Estás seguro de eliminar este equipo?"
            description="Se eliminarán todas sus ayudas técnicas asociadas."
            onConfirm={handleDeleteEquipment}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      </div>
      
      {/* Información del equipo */}
      <Row gutter={24}>
        <Col span={12}>
          <Card>
            <Descriptions title="Información del Equipo" bordered>
              <Descriptions.Item label="Nombre" span={3}>
                {equipment.name}
              </Descriptions.Item>
              <Descriptions.Item label="Nº Equipo" span={3}>
                {equipment.equipment_number}
              </Descriptions.Item>
              <Descriptions.Item label="Stock Inicial" span={3}>
                {equipment.initial_stock} unidades
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Ayudas Técnicas Activas"
                  value={activeLendings.length}
                  prefix={<AuditOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Unidades Disponibles"
                  value={equipment.available_stock}
                  suffix={`/ ${equipment.initial_stock}`}
                  valueStyle={{ color: equipment.available_stock === 0 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
            </Row>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Disponibilidad del Stock</Text>
                <Text type={stockPercentage < 20 ? "danger" : "secondary"}>
                  {Math.round(stockPercentage)}%
                </Text>
              </div>
              <Progress 
                percent={stockPercentage} 
                showInfo={false} 
                status={stockPercentage === 0 ? "exception" : "active"}
                strokeColor={
                  stockPercentage < 20 ? "#cf1322" : 
                  stockPercentage < 50 ? "#faad14" : "#52c41a"
                }
              />
              
              {equipment.available_stock === 0 && (
                <div style={{ marginTop: 8 }}>
                  <Tag icon={<WarningOutlined />} color="error">
                    Sin Stock Disponible
                  </Tag>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Historial de ayudas técnicas */}
      <div style={{ marginTop: 24 }}>
        <Title level={4}>
          <AuditOutlined /> Historial de Ayudas Técnicas
        </Title>
        <Table 
          columns={lendingsColumns} 
          dataSource={equipment.lendings} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>
      
      {/* Modal de Edición */}
      <Modal
        title="Editar Equipo"
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          initialValues={{
            name: equipment?.name,
            equipment_number: equipment?.equipment_number,
            initial_stock: equipment?.initial_stock
          }}
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[
              { required: true, message: "Por favor ingresa el nombre del equipo" }
            ]}
          >
            <Input placeholder="Nombre del equipo" />
          </Form.Item>

          <Form.Item
            name="equipment_number"
            label="Número de Equipo"
            rules={[
              { required: true, message: "Por favor ingresa el número del equipo" }
            ]}
          >
            <Input placeholder="Número identificador del equipo" />
          </Form.Item>

          <Form.Item
            name="initial_stock"
            label="Stock Inicial"
            rules={[
              { required: true, message: "Por favor ingresa el stock inicial" }
            ]}
            tooltip="Actualizar el stock inicial ajustará automáticamente el stock disponible"
          >
            <InputNumber min={1} placeholder="Stock inicial" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={handleEditCancel}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Guardar Cambios
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentDetailPage; 