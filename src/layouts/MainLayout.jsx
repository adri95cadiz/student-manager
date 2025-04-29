import React, { useState } from "react";
import { Layout, Menu, Breadcrumb } from "antd";
import {
  TeamOutlined,
  HomeOutlined,
  ToolOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content, Footer, Sider } = Layout;

// Función para obtener elementos del menú
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const items = [
  getItem("Inicio", "/", <HomeOutlined />),
  getItem("Estudiantes", "/students", <TeamOutlined />),
  getItem("Equipamientos", "/equipment", <ToolOutlined />),
  getItem("Ayudas Técnicas", "/technical-aids", <AuditOutlined />),
];

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar la clave seleccionada basada en la ruta actual
  const selectedKeys = [location.pathname];

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  // Lógica simple para el breadcrumb (se puede mejorar)
  const pathSnippets = location.pathname.split("/").filter((i) => i);
  const breadcrumbItems = [
    <Breadcrumb.Item key="home">
      <a href="#/">Inicio</a>
    </Breadcrumb.Item>,
    ...pathSnippets.map((snippet, index) => {
      const url = `#/${pathSnippets.slice(0, index + 1).join("/")}`;
      let name = "";
      switch (snippet) {
        case "students":
          name = "Estudiantes";
          break;
        case "equipment":
          name = "Equipamientos";
          break;
        case "technical-aids":
          name = "Ayudas Técnicas";
          break;
        default:
          name = snippet;
          break;
      }
      return (
        <Breadcrumb.Item key={url}>
          {/* Si es el último, no es un enlace */}
          {index === pathSnippets.length - 1 ? name : <a href={url}>{name}</a>}
        </Breadcrumb.Item>
      );
    }),
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <h2
          style={{
            margin: 16,
            color: "white",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          {collapsed ? "RM" : "Registro motórico"}
        </h2>
        <Menu
          theme="dark"
          selectedKeys={selectedKeys}
          mode="inline"
          items={items}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout className="site-layout">
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            {breadcrumbItems}
          </Breadcrumb>
          <div
            className="site-layout-background"
            style={{ padding: 24, minHeight: 360, background: "#fff" }}
          >
            {children} {/* Aquí se renderizará el contenido de cada página */}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
