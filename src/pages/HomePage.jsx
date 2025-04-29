import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Select,
  Table,
  Typography,
  Divider,
  Spin,
  Space,
  Empty,
  Tag,
  List,
  Avatar,
} from "antd";
import {
  TeamOutlined,
  ToolOutlined,
  AuditOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  PieChartOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Importación de componente para gráfico
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

// Registrar componentes necesarios para Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const { Title: AntTitle, Text } = Typography;
const { Option } = Select;

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("all");

  useEffect(() => {
    loadDashboardData();
  }, [selectedSchoolYear]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getDashboardStats({
        schoolYear: selectedSchoolYear,
      });
      setStats(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Columnas para la tabla de top equipos
  const topEquipmentColumns = [
    {
      title: "Equipamiento",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a onClick={() => navigate(`/equipment/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: "Nº Equipamiento",
      dataIndex: "equipment_number",
      key: "equipment_number",
      width: 120,
    },
    {
      title: "Ayudas Técnicas",
      dataIndex: "lending_count",
      key: "lending_count",
      width: 100,
      align: "right",
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
  ];

  // Preparación de datos para el gráfico
  const getChartData = () => {
    if (!stats) return null;

    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    return {
      labels: monthNames,
      datasets: [
        {
          label: "Ayudas Técnicas por Mes",
          data: stats.lendingsByMonth,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Ayudas Técnicas por Mes ${
          selectedSchoolYear !== "all"
            ? `(${selectedSchoolYear})`
            : "(Todos los cursos)"
        }`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Renderizado de componente de carga
  if (loading && !stats) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <AntTitle level={2} style={{ margin: 0 }}>
          <BarChartOutlined /> Panel de Control
        </AntTitle>

        <Space>
          <Text>Filtrar por Curso Escolar:</Text>
          <Select
            value={selectedSchoolYear}
            onChange={setSelectedSchoolYear}
            style={{ width: 150 }}
            loading={loading}
          >
            <Option value="all">Todos los Cursos</Option>
            {stats?.schoolYears.map((year) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* Primera fila - Estadísticas principales */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Estudiantes"
              value={stats?.totalStudents || 0}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Equipamientos"
              value={stats?.totalEquipment || 0}
              prefix={<ToolOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ayudas Técnicas Totales"
              value={stats?.totalLendings || 0}
              prefix={<AuditOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ayudas Técnicas Activas"
              value={stats?.activeLendings || 0}
              prefix={<AuditOutlined />}
              valueStyle={{ color: "#1890ff" }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Segunda fila - Gráfico y Promedio de días */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <>
                <BarChartOutlined /> Ayudas Técnicas por Mes
              </>
            }
          >
            {stats && stats.lendingsByMonth.some((count) => count > 0) ? (
              <Bar data={getChartData()} options={chartOptions} />
            ) : (
              <Empty
                description="No hay datos de ayudas técnicas para mostrar"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "40px 0" }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <>
                <ClockCircleOutlined /> Duración Promedio de Ayudas Técnicas
              </>
            }
          >
            {stats?.avgLendingDays && stats.avgLendingDays.length > 0 ? (
              <List
                dataSource={stats.avgLendingDays}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<CalendarOutlined />}
                          style={{ backgroundColor: "#1890ff" }}
                        />
                      }
                      title={`Curso ${item.school_year}`}
                      description={`${item.avg_days} días en promedio`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No hay datos de duración para mostrar"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Tercera fila - Top 5 equipos y estudiantes */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <>
                <PieChartOutlined /> Top 5 Equipamientos más Prestados
              </>
            }
          >
            {stats?.topEquipment && stats.topEquipment.length > 0 ? (
              <Table
                dataSource={stats.topEquipment}
                columns={topEquipmentColumns}
                rowKey="id"
                pagination={false}
                size="small"
                loading={loading}
              />
            ) : (
              <Empty
                description="No hay datos de equipamientos para mostrar"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <>
                <PieChartOutlined /> Top 5 Estudiantes con más Ayudas Técnicas
              </>
            }
          >
            {stats?.topStudents && stats.topStudents.length > 0 ? (
              <List
                dataSource={stats.topStudents}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Tag color="blue">
                        {item.lending_count} ayudas técnicas
                      </Tag>
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#52c41a" }}
                        />
                      }
                      title={
                        <a onClick={() => navigate(`/students/${item.id}`)}>
                          {`${item.name} ${item.surname}`}
                        </a>
                      }
                      description={`Nº Estudiante: ${item.student_number}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No hay datos de estudiantes para mostrar"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
