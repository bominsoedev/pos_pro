import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { ShoppingCart, Package, Users, BarChart3, CreditCard, Receipt } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: ShoppingCart,
            title: t('welcome.feature_pos'),
            description: t('welcome.feature_pos_desc'),
        },
        {
            icon: Package,
            title: t('welcome.feature_inventory'),
            description: t('welcome.feature_inventory_desc'),
        },
        {
            icon: Users,
            title: t('welcome.feature_customers'),
            description: t('welcome.feature_customers_desc'),
        },
        {
            icon: BarChart3,
            title: t('welcome.feature_reports'),
            description: t('welcome.feature_reports_desc'),
        },
        {
            icon: CreditCard,
            title: t('welcome.feature_payments'),
            description: t('welcome.feature_payments_desc'),
        },
        {
            icon: Receipt,
            title: t('welcome.feature_orders'),
            description: t('welcome.feature_orders_desc'),
        },
    ];

    return (
        <>
            <Head title={t('welcome.title')}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-slate-900 lg:justify-center lg:p-8 dark:from-slate-900 dark:to-slate-800 dark:text-slate-50">
                <header className="mb-6 w-full max-w-6xl text-sm">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium leading-normal text-slate-900 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
                            >
                                {t('welcome.dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-lg border border-transparent px-6 py-2.5 text-sm font-medium leading-normal text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                                >
                                    {t('welcome.log_in')}
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium leading-normal text-slate-900 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
                                    >
                                        {t('welcome.register')}
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow">
                    <main className="flex w-full max-w-6xl flex-col items-center">
                        {/* Hero Section */}
                        <div className="mb-12 text-center">
                            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
                                <ShoppingCart className="h-8 w-8 text-primary" />
                            </div>
                            <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
                                {t('welcome.hero_title')}
                            </h1>
                            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                                {t('welcome.hero_description')}
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="mb-12 grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={index}
                                        className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {feature.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA Section */}
                        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <h2 className="mb-4 text-2xl font-bold">
                                {t('welcome.cta_title')}
                            </h2>
                            <p className="mb-6 text-slate-600 dark:text-slate-400">
                                {t('welcome.cta_description')}
                            </p>
                            {!auth.user && (
                                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                                        >
                                            {t('welcome.get_started')}
                                        </Link>
                                    )}
                                    <Link
                                        href={login()}
                                        className="inline-block rounded-lg border border-slate-300 bg-white px-8 py-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
                                    >
                                        {t('welcome.log_in')}
                                    </Link>
                                </div>
                            )}
                            {auth.user && (
                                <Link
                                    href={dashboard()}
                                    className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                                >
                                    {t('welcome.go_to_dashboard')}
                                </Link>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
