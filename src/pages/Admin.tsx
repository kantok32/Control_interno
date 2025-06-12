import { PageHeader } from "../components/Layout";

const Admin = () => {
    return (
        <>
            <PageHeader title="Administración" />
            <section className="content-placeholder">
                <h3>Panel de Administración</h3>
                <p>Aquí se encontrarán las opciones de configuración y gestión de usuarios.</p>
            </section>
        </>
    );
};

export default Admin; 