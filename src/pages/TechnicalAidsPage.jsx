import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Space,
  Tooltip,
  Tag, // Para mostrar estado devuelto/pendiente
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  SwapOutlined, // Icono para acción de devolver
  FilterOutlined, // Icono para el filtro
  EditOutlined, // Icono para editar
  DeleteOutlined, // Icono para eliminar (se añadirá después)
} from "@ant-design/icons";
import dayjs from "dayjs"; // Para manejar fechas
import "dayjs/locale/es"; // Localización española para dayjs
import { Link } from "react-router-dom";
dayjs.locale("es");

const { Option } = Select;

const TechnicalAidsPage = () => {
  const [aids, setAids] = useState([]);
  const [filteredAids, setFilteredAids] = useState([]);
  const [students, setStudents] = useState([]); // Para el selector
  const [equipment, setEquipment] = useState([]); // Para el selector
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [editingAid, setEditingAid] = useState(null); // Datos de la ayuda a editar
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("all"); // Estado para el filtro de curso
  const [selectedEquipmentStock, setSelectedEquipmentStock] = useState(1); // Estado para el stock disponible
  const [returnStatusFilter, setReturnStatusFilter] = useState("all"); // Estado para filtro de devolución: 'all', 'returned', 'pending'

  // Carga inicial de datos
  useEffect(() => {
    fetchAllData();
  }, []);

  // Extraer cursos escolares únicos para el filtro
  const schoolYears = useMemo(() => {
    const years = new Set(aids.map((aid) => aid.school_year));
    return ["all", ...Array.from(years).sort().reverse()]; // 'all' y ordenar descendente
  }, [aids]);

  // Filtrado (añadir filtro por curso escolar y estado de devolución)
  useEffect(() => {
    const lowerSearchText = searchText.toLowerCase();
    setFilteredAids(
      aids.filter((aid) => {
        const matchesSearch =
          aid.student_name?.toLowerCase().includes(lowerSearchText) ||
          aid.student_surname?.toLowerCase().includes(lowerSearchText) ||
          aid.equipment_name?.toLowerCase().includes(lowerSearchText) ||
          aid.student_number?.toLowerCase().includes(lowerSearchText) ||
          aid.equipment_number?.toLowerCase().includes(lowerSearchText) ||
          aid.school_year?.toLowerCase().includes(lowerSearchText);
        const matchesYear =
          selectedSchoolYear === "all" ||
          aid.school_year === selectedSchoolYear;

        // Filtro por estado de devolución
        let matchesReturnStatus = true;
        if (returnStatusFilter === "returned") {
          matchesReturnStatus = !!aid.return_date;
        } else if (returnStatusFilter === "pending") {
          matchesReturnStatus = !aid.return_date;
        }

        return matchesSearch && matchesYear && matchesReturnStatus;
      })
    );
  }, [aids, searchText, selectedSchoolYear, returnStatusFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [aidsData, studentsData, equipmentData] = await Promise.all([
        window.electronAPI.getTechnicalAids(),
        window.electronAPI.getStudents(), // Necesitamos estudiantes para el selector
        window.electronAPI.getEquipment(), // Necesitamos equipos para el selector (con stock)
      ]);
      setAids(aidsData);
      setStudents(studentsData);
      setEquipment(equipmentData);
    } catch (error) {
      message.error(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setModalMode("add");
    setEditingAid(null);
    form.resetFields();
    form.setFieldsValue({ quantity: 1, lending_date: dayjs() });
    setIsModalVisible(true);
  };

  const showEditModal = (aid) => {
    setModalMode("edit");
    setEditingAid(aid);
    form.setFieldsValue({
      ...aid,
      lending_date: dayjs(aid.lending_date),
      return_date: aid.return_date ? dayjs(aid.return_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingAid(null); // Limpiar datos de edición al cerrar
  };

  const handleFormSubmit = async (values) => {
    if (modalMode === "add") {
      await handleAddAid(values);
    } else {
      await handleUpdateAid(values);
    }
  };

  const handleAddAid = async (values) => {
    setLoading(true);
    try {
      const aidData = {
        ...values,
        lending_date: values.lending_date.format("YYYY-MM-DD"), // Formatear fecha
      };
      await window.electronAPI.addTechnicalAid(aidData);
      message.success("Ayuda técnica registrada correctamente");
      setIsModalVisible(false);
      fetchAllData(); // Recargar todos los datos (incluido stock de equipos)
    } catch (error) {
      console.error("Error adding aid:", error);
      message.error(`Error al registrar ayuda técnica: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAid = async (values) => {
    if (!editingAid) return;
    setLoading(true);
    try {
      const aidData = {
        aidId: editingAid.id,
        ...values,
        lending_date: values.lending_date.format("YYYY-MM-DD"),
        return_date: values.return_date
          ? values.return_date.format("YYYY-MM-DD")
          : null,
      };
      await window.electronAPI.updateTechnicalAid(aidData);
      message.success("Ayuda técnica actualizada correctamente");
      setIsModalVisible(false);
      setEditingAid(null);
      fetchAllData();
    } catch (error) {
      console.error("Error updating aid:", error);
      message.error(`Error al actualizar ayuda técnica: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAid = async (aidId) => {
    setLoading(true);
    try {
      await window.electronAPI.returnTechnicalAid({ aidId });
      message.success("Ayuda técnica marcada como devuelta");
      fetchAllData(); // Recargar para ver cambio de estado y stock
    } catch (error) {
      console.error("Error returning aid:", error);
      message.error(`Error al devolver ayuda técnica: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAid = async (aidId) => {
    setLoading(true);
    try {
      await window.electronAPI.deleteTechnicalAid(aidId);
      message.success("Ayuda técnica eliminada correctamente");
      fetchAllData();
    } catch (error) {
      console.error("Error deleting aid:", error);
      message.error(`Error al eliminar ayuda técnica: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambio de equipo seleccionado
  const handleEquipmentChange = (equipmentId) => {
    const selectedEquipment = equipment.find((item) => item.id === equipmentId);
    if (selectedEquipment) {
      setSelectedEquipmentStock(selectedEquipment.available_stock);
      // Si el modo es añadir, ajustar la cantidad seleccionada al máximo disponible
      if (modalMode === "add") {
        const currentQuantity = form.getFieldValue("quantity") || 1;
        if (currentQuantity > selectedEquipment.available_stock) {
          form.setFieldsValue({ quantity: selectedEquipment.available_stock });
        }
      }
    }
  };

  const columns = [
    {
      title: "Acciones",
      key: "action",
      width: 120, // Más ancho para 3 botones
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar Ayuda">
            <Button
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>

          {/* Botón Devolver (si está pendiente) */}
          {!record.return_date ? (
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
                  ghost
                />
              </Popconfirm>
            </Tooltip>
          ) : (
            <span style={{ width: "32px", display: "inline-block" }}></span> // Placeholder para alinear
          )}

          {/* Botón Eliminar */}
          <Tooltip title="Eliminar Ayuda">
            <Popconfirm
              title="¿Estás seguro de querer eliminar esta ayuda técnica?"
              onConfirm={() => handleDeleteAid(record.id)}
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
      title: "Estado",
      dataIndex: "return_date",
      key: "status",
      width: 100,
      align: "center",
      render: (return_date, record) =>
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
      sorter: (a, b) => a.equipment_name.localeCompare(b.equipment_name),
      render: (_, record) => (
        <Link to={`/equipment/${record.equipment_id}`}>
          {record.equipment_name}
        </Link>
      ),
    },
    {
      title: "Nº Equipamiento",
      dataIndex: "equipment_number",
      key: "equipment_number",
      width: 120,
    },
    {
      title: "Estudiante",
      key: "student",
      render: (_, record) => `${record.student_name} ${record.student_surname}`,
      sorter: (a, b) =>
        `${a.student_name} ${a.student_surname}`.localeCompare(
          `${b.student_name} ${b.student_surname}`
        ),
      render: (_, record) => (
        <Link to={`/students/${record.student_id}`}>
          {record.student_name} {record.student_surname}
        </Link>
      ),
    },
    {
      title: "Nº Estudiante",
      dataIndex: "student_number",
      key: "student_number",
      width: 120,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      align: "right",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Fecha Adquisición",
      dataIndex: "lending_date",
      key: "lending_date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) =>
        dayjs(a.lending_date).unix() - dayjs(b.lending_date).unix(),
    },
    {
      title: "Fecha Devolución",
      dataIndex: "return_date",
      key: "return_date",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) =>
        dayjs(a.return_date || 0).unix() - dayjs(b.return_date || 0).unix(),
    },
    {
      title: "Curso Escolar",
      dataIndex: "school_year",
      key: "school_year",
      width: 120,
      sorter: (a, b) => a.school_year.localeCompare(b.school_year),
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
        <Space wrap>
          {" "}
          {/* Usar Space wrap para mejor layout en pantallas pequeñas */}
          <Input
            placeholder="Buscar (Equipo, Estudiante, Nº, Curso)"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            value={selectedSchoolYear}
            onChange={(value) => setSelectedSchoolYear(value)}
            style={{ width: 150 }}
            suffixIcon={<FilterOutlined />} // Icono de filtro
          >
            {schoolYears.map((year) => (
              <Option key={year} value={year}>
                {year === "all" ? "Todos los Cursos" : `Curso ${year}`}
              </Option>
            ))}
          </Select>
          <Select
            value={returnStatusFilter}
            onChange={(value) => setReturnStatusFilter(value)}
            style={{ width: 150 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">Todos los Estados</Option>
            <Option value="returned">Devueltos</Option>
            <Option value="pending">Pendientes</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          Registrar Ayuda
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredAids}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
        size="small"
      />

      {/* Modal para añadir/editar ayuda técnica */}
      <Modal
        title={
          modalMode === "add"
            ? "Registrar Nueva Ayuda Técnica"
            : "Editar Ayuda Técnica"
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="student_id"
            label="Estudiante"
            rules={[{ required: true, message: "Selecciona un estudiante" }]}
          >
            <Select
              showSearch
              placeholder="Busca o selecciona un estudiante"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              loading={loading}
              disabled={modalMode === "edit"}
            >
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {`${student.name} ${student.surname} ${
                    student.second_surname || ""
                  } (${student.student_number})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="equipment_id"
            label="Equipo"
            rules={[{ required: true, message: "Selecciona un equipo" }]}
          >
            <Select
              showSearch
              placeholder="Busca o selecciona un equipo (Stock disponible)"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              loading={loading}
              disabled={modalMode === "edit"}
              onChange={handleEquipmentChange}
            >
              {equipment.map((item) => (
                <Option
                  key={item.id}
                  value={item.id}
                  disabled={item.available_stock <= 0 && modalMode === "add"}
                >
                  {`${item.name} (${item.equipment_number}) - Disp: ${item.available_stock}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Cantidad"
            initialValue={1}
            rules={[{ required: true, message: "Introduce la cantidad" }]}
          >
            <InputNumber
              min={1}
              max={modalMode === "add" ? selectedEquipmentStock : undefined}
              style={{ width: "100%" }}
              disabled={modalMode === "edit"}
            />
          </Form.Item>

          <Form.Item
            name="lending_date"
            label="Fecha de Adquisición"
            rules={[{ required: true, message: "Selecciona la fecha" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          {modalMode === "edit" && (
            <Form.Item
              name="return_date"
              label="Fecha de Devolución (si aplica)"
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          )}

          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {modalMode === "add" ? "Registrar Ayuda" : "Guardar Cambios"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TechnicalAidsPage;
