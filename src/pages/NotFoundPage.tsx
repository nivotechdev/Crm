import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState titulo="Página não encontrada" acao={<Link to="/"><Button variante="primario">Ir para o painel</Button></Link>} />
    </div>
  );
}
