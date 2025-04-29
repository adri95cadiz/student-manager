import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  SearchOutlined,
  IdcardOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm(); // Hook de Ant Design para manejar el formulario
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate(); // Hook para navegación

  // Cargar estudiantes al montar
  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtrar estudiantes cuando cambie la lista o el texto de búsqueda
  useEffect(() => {
    const lowerSearchText = searchText.toLowerCase();
    setFilteredStudents(
      students.filter(
        (student) =>
          student.name.toLowerCase().includes(lowerSearchText) ||
          student.surname.toLowerCase().includes(lowerSearchText) ||
          (student.second_surname &&
            student.second_surname.toLowerCase().includes(lowerSearchText)) ||
          student.nie.toLowerCase().includes(lowerSearchText) ||
          student.student_number.toLowerCase().includes(lowerSearchText)
      )
    );
  }, [students, searchText]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getStudents();
      setStudents(data);
    } catch (error) {
      message.error(`Error al cargar estudiantes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    form.resetFields(); // Limpiar formulario antes de mostrar
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleAddStudent = async (values) => {
    setLoading(true);
    try {
      // Asegurarse de que second_surname sea null si está vacío
      const studentData = {
        ...values,
        second_surname: values.second_surname || null,
      };
      await window.electronAPI.addStudent(studentData);
      message.success("Estudiante añadido correctamente");
      setIsModalVisible(false);
      fetchStudents(); // Recargar la lista
    } catch (error) {
      console.error("Error adding student:", error);
      // Intentar mostrar un mensaje más específico si es un error de constraint UNIQUE
      if (error.message && error.message.includes("UNIQUE constraint failed")) {
        if (error.message.includes("nie")) {
          message.error("Error: El NIE introducido ya existe.");
        } else if (error.message.includes("student_number")) {
          message.error(
            "Error: El número de estudiante introducido ya existe."
          );
        } else {
          message.error(`Error al añadir estudiante: ${error.message}`);
        }
      } else {
        message.error(`Error al añadir estudiante: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ----- INICIO: Lógica para eliminar -----
  const handleDeleteStudent = async (studentId) => {
    setLoading(true); // Indicar carga mientras se elimina
    try {
      await window.electronAPI.deleteStudent(studentId);
      message.success("Estudiante eliminado correctamente");
      fetchStudents(); // Recargar lista tras eliminar
    } catch (error) {
      console.error("Error deleting student:", error);
      message.error(`Error al eliminar estudiante: ${error.message}`);
    } finally {
      setLoading(false); // Quitar indicador de carga
    }
  };
  // ----- FIN: Lógica para eliminar -----

  // Definición de columnas para la tabla (con Acciones al principio)
  const columns = [
    {
      title: "Acciones",
      key: "action",
      width: 100, // Ajustar ancho
      align: "center", // Centrar iconos
      render: (_, record) => (
        <Space size="small">
          {" "}
          {/* Reducir espacio entre iconos */}
          <Tooltip title="Ver Detalles">
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/students/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Popconfirm
              title="¿Seguro que quieres eliminar este estudiante?"
              onConfirm={() => handleDeleteStudent(record.id)}
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
      title: "Nº Estudiante",
      dataIndex: "student_number",
      key: "student_number",
      sorter: (a, b) => a.student_number.localeCompare(b.student_number),
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Link to={`/students/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: "Primer Apellido",
      dataIndex: "surname",
      key: "surname",
      sorter: (a, b) => a.surname.localeCompare(b.surname),
    },
    {
      title: "Segundo Apellido",
      dataIndex: "second_surname",
      key: "second_surname",
      sorter: (a, b) =>
        (a.second_surname || "").localeCompare(b.second_surname || ""),
      render: (text) => text || "-", // Mostrar '-' si no hay segundo apellido
    },
    {
      title: "NIE",
      dataIndex: "nie",
      key: "nie",
      sorter: (a, b) => a.nie.localeCompare(b.nie),
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
        <Input
          placeholder="Buscar estudiante (Nombre, Apellidos, NIE, Nº Estudiante)"
          prefix={<SearchOutlined />}
          style={{ width: 400 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          Añadir Estudiante
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredStudents}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }} // Mejoras en paginación
        size="small" // Tabla un poco más compacta
      />

      {/* Modal para añadir estudiante */}
      <Modal
        title="Añadir Nuevo Estudiante"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddStudent}
          requiredMark={false}
        >
          <Form.Item
            name="student_number"
            label="Número de Estudiante"
            rules={[
              {
                required: true,
                message: "Por favor, introduce el número de estudiante",
              },
            ]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="Número de Estudiante"
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Nombre"
            rules={[
              { required: true, message: "Por favor, introduce el nombre" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nombre" />
          </Form.Item>
          <Form.Item
            name="surname"
            label="Primer Apellido"
            rules={[
              {
                required: true,
                message: "Por favor, introduce el primer apellido",
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Primer Apellido" />
          </Form.Item>
          <Form.Item name="second_surname" label="Segundo Apellido (Opcional)">
            <Input prefix={<UserOutlined />} placeholder="Segundo Apellido" />
          </Form.Item>
          <Form.Item name="nie" label="NIE/Documento Identificativo (Opcional)">
            <Input prefix={<IdcardOutlined />} placeholder="NIE" />
          </Form.Item>
          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Añadir Estudiante
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentsPage;
