import { PageHeader } from "../components/Layout";

const Dashboard = () => {
    return (
        <>
            <PageHeader title="Dashboard" />
            <section className="content-placeholder">
                <h3>Bienvenido al Dashboard</h3>
                <p>Aquí se mostrará la información principal y los indicadores clave.</p>
            </section>
        </>
    );
};

export default Dashboard; 