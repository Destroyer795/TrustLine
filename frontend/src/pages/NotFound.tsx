import { ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { DoubleBezel } from '../components/ui';
export const NotFound = () => <DoubleBezel className="mx-auto max-w-3xl page-enter" innerClassName="p-10 text-center md:p-16"><p className="eyebrow">404 / Route not found</p><h1 className="display-title mt-5 font-semibold">This line does not exist.</h1><p className="mx-auto mt-5 max-w-md text-muted-ink">Return to the live credit infrastructure and continue the demonstration.</p><Link to="/" className="btn-primary mt-8"><ArrowLeft size={18} />Return to overview</Link></DoubleBezel>;
