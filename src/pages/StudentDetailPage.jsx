import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  message,
  Divider,
  Statistic,
  Row,
  Col,
  Skeleton,
  Popconfirm,
  Tooltip,
  Empty,
  Modal,
  Form,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  UserOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const StudentDetailPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchStudentDetail = async () => {
      setLoading(true);
      try {
        const data = await window.electronAPI.getStudentDetail(
          parseInt(studentId)
        );
        setStudent(data);
      } catch (err) {
        console.error("Error fetching student details:", err);
        setError("No se pudo cargar la información del estudiante.");
        message.error("Error al cargar los detalles del estudiante.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetail();
  }, [studentId]);

  const handleReturnAid = async (aidId) => {
    try {
      await window.electronAPI.returnTechnicalAid({ aidId });
      message.success("Ayuda técnica marcada como devuelta");
      // Recargar los datos del estudiante
      const data = await window.electronAPI.getStudentDetail(
        parseInt(studentId)
      );
      setStudent(data);
    } catch (error) {
      console.error("Error returning aid:", error);
      message.error(`Error al devolver ayuda técnica: ${error.message}`);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await window.electronAPI.deleteStudent(parseInt(studentId));
      message.success("Estudiante eliminado correctamente");
      navigate("/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      message.error(`Error al eliminar estudiante: ${error.message}`);
    }
  };

  const showEditModal = () => {
    form.setFieldsValue({
      name: student.name,
      surname: student.surname,
      second_surname: student.second_surname || '',
      nie: student.nie || '',
      student_number: student.student_number
    });
    setIsEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
  };

  const handleEditSubmit = async (values) => {
    try {
      await window.electronAPI.updateStudent({
        id: parseInt(studentId),
        ...values
      });
      message.success("Estudiante actualizado correctamente");
      setIsEditModalVisible(false);
      // Recargar los datos del estudiante
      const data = await window.electronAPI.getStudentDetail(parseInt(studentId));
      setStudent(data);
    } catch (error) {
      console.error("Error updating student:", error);
      message.error(`Error al actualizar estudiante: ${error.message}`);
    }
  };

  // Columnas para la tabla de ayudas técnicas
  const lendingsColumns = [
    {
      title: "Estado",
      dataIndex: "return_date",
      key: "status",
      width: 100,
      align: "center",
      render: (return_date) =>
        return_date ? (
          <Tag color="green">Devuelto</Tag>
        ) : (
          <Tag color="orange">Pendiente</Tag>
        ),
    },
    {
      title: "Equipamiento",
      dataIndex: "equipment_name",
      key: "equipment_name",
      render: (text, record) => (
        <a onClick={() => navigate(`/equipment/${record.equipment_id}`)}>
          {text}
        </a>
      ),
    },
    {
      title: "Nº Equipamiento",
      dataIndex: "equipment_number",
      key: "equipment_number",
      width: 120,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      align: "right",
    },
    {
      title: "Fecha Adquisición",
      dataIndex: "lending_date",
      key: "lending_date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Fecha Devolución",
      dataIndex: "return_date",
      key: "return_date",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Curso Escolar",
      dataIndex: "school_year",
      key: "school_year",
      width: 120,
    },
    {
      title: "Acciones",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) =>
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
        ) : null,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ padding: 24 }}>
        <Empty
          description={error || "No se encontró información del estudiante"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate("/students")}>
            Volver a Estudiantes
          </Button>
        </div>
      </div>
    );
  }

  // Calcular ayudas técnicas activas y dispositivos prestados
  const activeLendings = student.lendings.filter(
    (lending) => !lending.return_date
  );
  const totalDevices = activeLendings.reduce(
    (sum, lending) => sum + lending.quantity,
    0
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Cabecera con botones de acción */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/students")}
          >
            Volver
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            <UserOutlined /> {student.name} {student.surname}{" "}
            {student.second_surname || ""}
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
            title="¿Estás seguro de eliminar este estudiante?"
            description="Se eliminarán todas sus ayudas técnicas asociadas."
            onConfirm={handleDeleteStudent}
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

      {/* Información del estudiante */}
      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Descriptions title="Información Personal" bordered>
              <Descriptions.Item label="Nombre" span={3}>
                {student.name} {student.surname} {student.second_surname || ""}
              </Descriptions.Item>
              <Descriptions.Item label="Nº Estudiante" span={3}>
                {student.student_number}
              </Descriptions.Item>
              <Descriptions.Item label="NIE" span={3}>
                {student.nie || "No especificado"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Ayudas Técnicas Activas"
              value={activeLendings.length}
              prefix={<AuditOutlined />}
            />
            <Divider style={{ margin: "16px 0" }} />
            <Statistic
              title="Ayudas Técnicas Totales"
              value={totalDevices}
              prefix={<AuditOutlined />}
            />
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
          dataSource={student.lendings}
          showSorterTooltip={false}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      {/* Modal de Edición */}
      <Modal
        title="Editar Estudiante"
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
            name: student?.name,
            surname: student?.surname,
            second_surname: student?.second_surname || '',
            nie: student?.nie || '',
            student_number: student?.student_number
          }}
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[
              { required: true, message: "Por favor ingresa el nombre" }
            ]}
          >
            <Input placeholder="Nombre del estudiante" />
          </Form.Item>

          <Form.Item
            name="surname"
            label="Primer Apellido"
            rules={[
              { required: true, message: "Por favor ingresa el primer apellido" }
            ]}
          >
            <Input placeholder="Primer apellido" />
          </Form.Item>

          <Form.Item
            name="second_surname"
            label="Segundo Apellido"
          >
            <Input placeholder="Segundo apellido (opcional)" />
          </Form.Item>

          <Form.Item
            name="nie"
            label="NIE"
          >
            <Input placeholder="NIE (opcional)" />
          </Form.Item>

          <Form.Item
            name="student_number"
            label="Número de Estudiante"
            rules={[
              { required: true, message: "Por favor ingresa el número de estudiante" }
            ]}
          >
            <Input placeholder="Número de estudiante" />
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

export default StudentDetailPage;
