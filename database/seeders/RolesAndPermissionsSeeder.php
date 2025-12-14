<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // POS Permissions
            ['name' => 'View POS', 'slug' => 'pos.view', 'group' => 'POS'],
            ['name' => 'Create Sale', 'slug' => 'pos.create', 'group' => 'POS'],
            
            // Products Permissions
            ['name' => 'View Products', 'slug' => 'products.view', 'group' => 'Products'],
            ['name' => 'Create Products', 'slug' => 'products.create', 'group' => 'Products'],
            ['name' => 'Update Products', 'slug' => 'products.update', 'group' => 'Products'],
            ['name' => 'Delete Products', 'slug' => 'products.delete', 'group' => 'Products'],
            
            // Categories Permissions
            ['name' => 'View Categories', 'slug' => 'categories.view', 'group' => 'Categories'],
            ['name' => 'Manage Categories', 'slug' => 'categories.manage', 'group' => 'Categories'],
            
            // Customers Permissions
            ['name' => 'View Customers', 'slug' => 'customers.view', 'group' => 'Customers'],
            ['name' => 'Manage Customers', 'slug' => 'customers.manage', 'group' => 'Customers'],
            
            // Orders Permissions
            ['name' => 'View Orders', 'slug' => 'orders.view', 'group' => 'Orders'],
            ['name' => 'Manage Orders', 'slug' => 'orders.manage', 'group' => 'Orders'],
            ['name' => 'Process Refunds', 'slug' => 'orders.refund', 'group' => 'Orders'],
            
            // Inventory Permissions
            ['name' => 'View Inventory', 'slug' => 'inventory.view', 'group' => 'Inventory'],
            ['name' => 'Manage Inventory', 'slug' => 'inventory.manage', 'group' => 'Inventory'],
            
            // Reports Permissions
            ['name' => 'View Reports', 'slug' => 'reports.view', 'group' => 'Reports'],
            ['name' => 'Export Reports', 'slug' => 'reports.export', 'group' => 'Reports'],
            
            // Settings Permissions
            ['name' => 'View Settings', 'slug' => 'settings.view', 'group' => 'Settings'],
            ['name' => 'Manage Settings', 'slug' => 'settings.manage', 'group' => 'Settings'],
            
            // Users & Roles Permissions
            ['name' => 'View Users', 'slug' => 'users.view', 'group' => 'Users'],
            ['name' => 'Manage Users', 'slug' => 'users.manage', 'group' => 'Users'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage', 'group' => 'Users'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        // Create Roles
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Full system access',
                'is_active' => true,
            ]
        );

        $managerRole = Role::firstOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Manager',
                'description' => 'Can manage products, orders, and reports',
                'is_active' => true,
            ]
        );

        $cashierRole = Role::firstOrCreate(
            ['slug' => 'cashier'],
            [
                'name' => 'Cashier',
                'description' => 'Can process sales and view basic information',
                'is_active' => true,
            ]
        );

        // Assign all permissions to admin
        $adminRole->permissions()->sync(Permission::pluck('id'));

        // Assign permissions to manager
        $managerPermissions = Permission::whereIn('slug', [
            'pos.view', 'pos.create',
            'products.view', 'products.create', 'products.update', 'products.delete',
            'categories.view', 'categories.manage',
            'customers.view', 'customers.manage',
            'orders.view', 'orders.manage', 'orders.refund',
            'inventory.view', 'inventory.manage',
            'reports.view', 'reports.export',
            'settings.view',
        ])->pluck('id');
        $managerRole->permissions()->sync($managerPermissions);

        // Assign permissions to cashier
        $cashierPermissions = Permission::whereIn('slug', [
            'pos.view', 'pos.create',
            'products.view',
            'customers.view',
            'orders.view',
        ])->pluck('id');
        $cashierRole->permissions()->sync($cashierPermissions);

        // Assign admin role to first user if exists
        $firstUser = User::first();
        if ($firstUser && !$firstUser->roles()->exists()) {
            $firstUser->roles()->attach($adminRole->id);
        }
    }
}
